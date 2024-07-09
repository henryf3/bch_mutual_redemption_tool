/* eslint-disable no-console, no-use-before-define */

// Custodial example of establishing the parameters for an AnyHedge contract and funding it.
// The contract will redeem through the default redemption service.
// After making settings, you can run the sample one time to get the required funding details for short and long.
// After funding the addresses, you can run again for the example to create an actual contract.

// ### ADDED BY HENRY C
// ### IF YOU PUT FUNDED ADDRESSES IT WILL CREATE A CONTRACT INMEDIATELY

import { AnyHedgeManager } from '@generalprotocols/anyhedge';
import { instantiateSha256, decodePrivateKeyWif, hexToBin, flattenBinArray, encodeDataPush, instantiateSecp256k1, generateSigningSerializationBCH, binToHex, encodeTransaction, cashAddressToLockingBytecode, instantiateRipemd160, encodeCashAddress, CashAddressType, decodeTransactionUnsafe, SigningSerializationFlag } from '@bitauth/libauth';
import { ElectrumNetworkProvider } from 'cashscript';
import { OracleNetwork, OracleData } from '@generalprotocols/price-oracle';


const CONTRACT_USE_SHORT_LEVERAGE = false;
// Set the oracle public key to one that you know is operational and available. This is the production USD price oracle.
const ORACLE_PUBLIC_KEY = '02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818';
// Set the oracle relay to a public relay that can get data for the oracle listed above.
const ORACLE_RELAY = 'oracles.generalprotocols.com'
// Name a value that can be used as an integer-based boolean (as contracts do)
const INTEGER_TRUE = BigInt('1');
const INTEGER_FALSE = BigInt('0');

function create_manager(authentication_token) {
    const config =
    {
        authenticationToken: authentication_token,
        serviceDomain: 'api.anyhedge.com',
        servicePort: 443,
        serviceScheme: 'https'
    };

    const anyHedgeManager = new AnyHedgeManager(config);

    return anyHedgeManager

}



// Get the external start conditions for an AnyHedge contract (start price, start block height)
const getStartConditions = async function () {
    // Define the search parameters to request the most recent price for the oracle.
    const searchRequest =
    {
        publicKey: ORACLE_PUBLIC_KEY,
        minDataSequence: 1,
        count: 1,
    };

    // Request the the latest price as specified in the search parameters.
    const requestedMessages = await OracleNetwork.request(searchRequest, ORACLE_RELAY, 7083);

    // Extract the latest message from the response.
    const { message, signature, publicKey } = requestedMessages[0];

    // Verify an oracle price message signature.
    const validMessageSignature = await OracleData.verifyMessageSignature(hexToBin(message), hexToBin(signature), hexToBin(publicKey));

    // Throw an error if the signature could not be properly validated.
    if (!validMessageSignature) {
        throw (new Error('Could not get starting conditions due to the oracle relay providing an invalid signature for the message.'));
    }

    // Return starting oracle message and signature.
    return [message, signature];
};

// Parse a WIF string into a private key, public key and address.
const parseWIF = async function (wif) {
    // Instantiate Libauth crypto interfaces
    const secp256k1 = await instantiateSecp256k1();
    const sha256 = await instantiateSha256();
    const ripemd160 = await instantiateRipemd160();

    // Attempt to decode WIF string into a private key
    const decodeResult = decodePrivateKeyWif(wif);

    // If decodeResult is a string, it represents an error, so we throw it.
    if (typeof decodeResult === 'string') throw (new Error(decodeResult));

    // Extract the private key from the decodeResult.
    const privateKeyBin = decodeResult.privateKey;

    // Derive the corresponding public key.
    const publicKeyBin = secp256k1.derivePublicKeyCompressed(privateKeyBin);

    // Hash the public key hash according to the P2PKH scheme.
    const publicKeyHashBin = ripemd160.hash(sha256.hash(publicKeyBin));

    // Encode the public key hash into a P2PKH cash address.
    const address = encodeCashAddress('bitcoincash', CashAddressType.p2pkh, publicKeyHashBin);

    return [binToHex(privateKeyBin), binToHex(publicKeyBin), address];
};

// Build a transaction that funds a contract and pays a settlement service fee.
const buildFundingTransaction = async function (shortPrivateKey, shortMutualRedeemPublicKey, shortPayoutAddress, longPrivateKey, longMutualRedeemPublicKey, longPayoutAddress, contractData) {
    // Get a list of coins for the short and long addresses.
    const shortCoins = await getCoins(shortPayoutAddress);
    const longCoins = await getCoins(longPayoutAddress);

    // Sum all short and long coins to calculate the balances.
    const shortBalance = await sumCoins(shortCoins);
    const longBalance = await sumCoins(longCoins);

    // Extract relevant data from contract metadata.
    const { shortInputInSatoshis, longInputInSatoshis, minerCostInSatoshis } = contractData.metadata;

    // Set the dust cost used to ensure that contract can't end up paying out less than dust to either side.
    const dustCostInSatoshis = BigInt('1332');

    // Calculate the amounts necessary to fund the contract.
    const shortContractAmount = shortInputInSatoshis;
    const longContractAmount = longInputInSatoshis + minerCostInSatoshis + dustCostInSatoshis;

    let serviceFees = BigInt('0');
    for (const serviceFee of contractData.fees) {
        serviceFees += serviceFee.satoshis;
    }

    // Roughly calculate the miner fees for the funding transaction for both sides.
    // See https://bitcoin.stackexchange.com/questions/1195/how-to-calculate-transaction-size-before-sending-legacy-non-segwit-p2pkh-p2sh/46379
    const INPUT_SIZE = BigInt('148');
    const OUTPUT_SIZE = BigInt('34');

    // The fixed part of the transaction fee consists of a base of 10 plus the outputs (one funding, and all fees).
    const fixedFee = BigInt('10') + (BigInt(1 + contractData.fees.length) * OUTPUT_SIZE);

    // Both parties pay for their own inputs and outputs, but short also pays the fixed miner fees.
    const shortMinerFee = (INPUT_SIZE * BigInt(shortCoins.length)) + OUTPUT_SIZE + fixedFee;
    const longMinerFee = (INPUT_SIZE * BigInt(longCoins.length)) + OUTPUT_SIZE;

    // Calculate the total amount needed to perform the funding transaction.
    const shortSendAmount = shortContractAmount + shortMinerFee + serviceFees;
    const longSendAmount = longContractAmount + longMinerFee;

    // Verify that the short has enough funds to enter the contract.
    if ((shortBalance < shortSendAmount) || (longBalance < longSendAmount)) {
        throw (new Error(`Short (${shortPayoutAddress}) has ${shortBalance} sats and requires at least ${shortSendAmount} sats. Long (${longPayoutAddress}) has ${longBalance} sats and requires at least ${longSendAmount} sats.`));
    }

    // Calculate return amounts by subtracting the send amount from the total balance
    const shortReturnAmount = shortBalance - shortSendAmount;
    const longReturnAmount = longBalance - longSendAmount;

    // Initialize an empty array of outputs
    const outputs = [];

    // Set the target amount to be sent to the contract.
    outputs.push(createOutput(contractData.address, (shortContractAmount + longContractAmount)));

    // Add outputs to pay the service fees.
    for (const serviceFee of contractData.fees) {
        outputs.push(createOutput(serviceFee.address, serviceFee.satoshis));
    }

    // It is a rule of the BCH network that an output must have a minimum value.
    // See [issue #22](https://gitlab.com/GeneralProtocols/anyhedge/contracts/-/issues/22) for discussion of this number
    const MIN_RETURN_AMOUNT = BigInt('1332');

    // Send the remainder back to the wallets if it is at least the min return amount.
    // If it is below the min return amount, the remainder is instead added to the miner fee.
    // NOTE: Change address is the same address as we will be sending from.
    if (shortReturnAmount >= MIN_RETURN_AMOUNT) {
        outputs.push(createOutput(shortPayoutAddress, shortReturnAmount));
    }
    if (longReturnAmount >= MIN_RETURN_AMOUNT) {
        outputs.push(createOutput(longPayoutAddress, longReturnAmount));
    }

    // Convert all coins to unsigned Libauth Input format
    const unsignedInputs = [...shortCoins, ...longCoins].map(coinToInput);

    // Assemble the unsigned transaction.
    const unsignedTransaction =
    {
        inputs: unsignedInputs,
        locktime: 0,
        outputs,
        version: 2,
    };

    // Set up a function to sign inputs.
    const signInput = async function (input, inputIndex) {
        // Check whether the current input belongs to the short (if not, they belong to the long)
        const inputBelongsToHedge = inputIndex < shortCoins.length;

        // Pick the correct keys & address depending on the input index
        const publicKey = (inputBelongsToHedge ? shortMutualRedeemPublicKey : longMutualRedeemPublicKey);
        const privateKey = (inputBelongsToHedge ? shortPrivateKey : longPrivateKey);
        const address = (inputBelongsToHedge ? shortPayoutAddress : longPayoutAddress);

        // Derive the input's locking script from its address.
        const lockScriptResult = cashAddressToLockingBytecode(address);

        // If lockScriptResult is a string, it represents an error, so we throw it.
        if (typeof lockScriptResult === 'string') throw (new Error(lockScriptResult));

        // Extract the bytecode (locking script) from the lockScriptResult.
        const lockScriptBin = lockScriptResult.bytecode;

        // Use the SIGHASH_ALL hashtype for signing (with BCH replay protection included).
        // Also include the SIGHASH_FORK_ID flag, which is required for all transactions on BCH.
        const signingSerializationType = Uint8Array.of(SigningSerializationFlag.allOutputs | SigningSerializationFlag.forkId);

        // Generate a transaction signature for this input.
        const signatureBin = await signTransactionInput(unsignedTransaction, input.valueSatoshis, inputIndex, lockScriptBin, signingSerializationType, hexToBin(privateKey));

        // Build the unlocking script that unlocks the P2PKH locking script.
        const unlockingBytecode = flattenBinArray([encodeDataPush(signatureBin), encodeDataPush(hexToBin(publicKey))]);

        // Add the unlocking script to the input.
        const signedInput = { ...input, unlockingBytecode };

        return signedInput;
    }

    // Sign the inputs.
    const inputs = await Promise.all(unsignedInputs.map(signInput));

    // Assemble the signed transaction.
    const transaction =
    {
        inputs,
        locktime: 0,
        outputs,
        version: 2,
    };

    // Hex encode the built transaction.
    const encodedTransaction = binToHex(encodeTransaction(transaction));

    return encodedTransaction;
};

// Retrieve an address' coins using an ElectrumNetworkProvider.
const getCoins = async function (address) {
    // Create a new ElectrumNetworkProvider.
    const provider = new ElectrumNetworkProvider();

    // Request an address' coins.
    const coins = await provider.getUtxos(address);

    return coins;
};

// Retrieve a transaction hex string from a transaction ID.
const getTransaction = async function (transactionId) {
    // Create a new ElectrumNetworkProvider.
    const provider = new ElectrumNetworkProvider();

    // Request a raw transaction hex.
    const transactionHex = await provider.getRawTransaction(transactionId);

    return transactionHex;
};

// Sum a list of coins.
const sumCoins = async function (coins) {
    // Calculate the total balance of all coins.
    const balance = coins.reduce((totalSats, coin) => (totalSats + coin.satoshis), BigInt('0'));

    return balance;
};

// Create a Libauth compatible output for an amount to an address.
const createOutput = function (address, amount) {
    // Generate the locking script for the passed address.
    const lockScriptResult = cashAddressToLockingBytecode(address);

    // If lockScriptResult is a string, it represents an error, so we throw it.
    if (typeof lockScriptResult === 'string') throw (new Error(lockScriptResult));

    // Extract the bytecode (locking script) from the lockScriptResult.
    const lockingBytecode = lockScriptResult.bytecode;

    // Convert the amount to a BCH script number just in case it is not already.
    const valueSatoshis = BigInt(amount);

    // Assemble the output.
    const output = { lockingBytecode, valueSatoshis };

    return output;
};

// Convert a coin (returned by the ElectrumNetworkProvider) to a Libauth input format.
const coinToInput = function (coin) {
    // Convert the coin's properties to Libauth input properties.
    const input =
    {
        outpointIndex: coin.vout,
        outpointTransactionHash: hexToBin(coin.txid),
        sequenceNumber: 0,
        unlockingBytecode: new Uint8Array(),
        valueSatoshis: coin.satoshis,
    };

    return input;
};

// Sign a single transaction input using a private key.
const signTransactionInput = async function (transaction, satoshis, inputIndex, coveredBytecodeBin, signingSerializationType, privateKeyBin) {
    // Generate the signing serialization for this transaction input.
    const signingSerialization = await createSigningSerialization(transaction, satoshis, inputIndex, coveredBytecodeBin, signingSerializationType);

    // Generate the "sighash" by taking the double SHA256 of the signing serialization.
    const sha256 = await instantiateSha256();
    const sighash = sha256.hash(sha256.hash(signingSerialization));

    // Instantiate the Secp256k1 interface.
    const secp256k1 = await instantiateSecp256k1();

    // Generate a signature over the "sighash" using the passed private key.
    const signatureBin = secp256k1.signMessageHashSchnorr(privateKeyBin, sighash);

    // Append the signing serialization type to the signature to turn it into a valid transaction signature.
    const transactionSignature = Uint8Array.from([...signatureBin, signingSerializationType]);

    return transactionSignature;
};

// Create the signing serialization for a certain transaction input.
// Note: This is advanced functionality
const createSigningSerialization = async function (transaction, inputSatoshis, inputIndex, inputLockingBytecode, signingSerializationType) {
    // Include the source output for the input being compiled
    const sourceOutputs = [];

    // For this use, only the source output at `inputIndex` needs to be defined, any others would be ignored
    sourceOutputs[inputIndex] =
    {
        // For this use, `lockingBytecode` is not read, so it can be an empty Uint8Array
        lockingBytecode: Uint8Array.of(),

        // the value in satoshis of the UTXO spent by this signature, converted to BigInt just in case it is not already.
        valueSatoshis: BigInt(inputSatoshis),
    };

    // Generate the signing serialization.
    const signingSerialization = generateSigningSerializationBCH(
        // Provide the Libauth CompilationContextBCH
        { transaction, inputIndex, sourceOutputs },
        {
            // The covered bytecode is the full locking bytecode for the provided input
            coveredBytecode: inputLockingBytecode,
            // The signing serialization type is provided in this function's parameters
            signingSerializationType,
        },
    );

    return signingSerialization;
};

const create_p2p_contract = async function (data) {
    // Set how many US cents that Short would like to protect against price volatility.
    const NOMINAL_UNITS = Number(data.nom_units);

    // Set the contract duration in seconds, after which the contract is matured.
    const CONTRACT_DURATION_IN_SECONDS = BigInt(Number(data.cont_dur_insec));

    // Set the multipliers for how much the price can change before the contract is liquidated.
    // For example assuming the price today is $300 then:
    // if low multiplier = 0.75, the low liquidation price will be $300 * 0.75 = $225.
    // if high multiplier = 1.25, the high liquidation price will be $300 * 1.25 = $375.
    const CONTRACT_LOW_LIQUIDATION_PRICE_MULTIPLIER = Number(data.low_liq_mult);
    const CONTRACT_HIGH_LIQUIDATION_PRICE_MULTIPLIER = Number(data.hig_liq_mult);

    const SHORT_WIF = data.p1_short_key;
    const LONG_WIF = data.p2_long_key;

    const anyHedgeManager = create_manager(data.auth_token);

    // Allow mutual redemptions for this contract.
    const enableMutualRedemption = INTEGER_TRUE;

    // Collect all the parameters that we need to create a contract
    const [startingOracleMessage, startingOracleSignature] = await getStartConditions();
    const [shortPrivateKey, shortMutualRedeemPublicKey, shortPayoutAddress] = await parseWIF(SHORT_WIF);
    const [longPrivateKey, longMutualRedeemPublicKey, longPayoutAddress] = await parseWIF(LONG_WIF);

    // Calculate the maturity timestamp based on the contract duration.
    const maturityTimestamp = BigInt(Math.ceil((Date.now() / 1000))) + CONTRACT_DURATION_IN_SECONDS;

    // Gather all contract creation parameters.
    const contractCreationParameters =
    {
        takerSide: 'short',
        makerSide: 'long',
        oraclePublicKey: ORACLE_PUBLIC_KEY,
        shortMutualRedeemPublicKey,
        longMutualRedeemPublicKey,
        shortPayoutAddress,
        longPayoutAddress,
        enableMutualRedemption,
        isSimpleHedge: CONTRACT_USE_SHORT_LEVERAGE ? INTEGER_FALSE : INTEGER_TRUE,
        nominalUnits: NOMINAL_UNITS,
        startingOracleMessage,
        startingOracleSignature,
        maturityTimestamp,
        highLiquidationPriceMultiplier: CONTRACT_HIGH_LIQUIDATION_PRICE_MULTIPLIER,
        lowLiquidationPriceMultiplier: CONTRACT_LOW_LIQUIDATION_PRICE_MULTIPLIER,
    };

    try {
        // Declare contractData.
        let contractData;

        try {
            // Retrieve contract data from the settlement service if a contract with these details is already registered.
            const { address } = await anyHedgeManager.createContract(contractCreationParameters);
            contractData = await anyHedgeManager.getContractStatus(address);

            // Log the contract address for easier debugging.
            console.log(`Retrieved registered contract data for '${contractData.address}' from the settlement service.`);
        }
        catch (error) {
            // If no contract is registered under this address yet, we register it with the settlement service.
            contractData = await anyHedgeManager.registerContractForSettlement(contractCreationParameters);

            // Log the contract address for easier debugging.
            console.log(`Registered '${contractData.address}' for automated settlement after funding is complete.`);
        }

        console.log('Technical contract details:');
        console.log(contractData);

        // Build a transaction that funds the contract and pays a service fee to the settlement service provider.
        const fundingTransaction = await buildFundingTransaction(shortPrivateKey, shortMutualRedeemPublicKey, shortPayoutAddress, longPrivateKey, longMutualRedeemPublicKey, longPayoutAddress, contractData);

        // Extract a list of "dependency transactions" to pass into the submitFundingTransaction().
        // Note: This is optional and usually not necessary, but it can be used to ensure that the settlement service
        // knows about the necessary dependency transactions. This can be useful if these dependency transactions were
        // submitted very shortly before submitting the funding transaction.
        const decodedTransaction = decodeTransactionUnsafe(hexToBin(fundingTransaction));
        const dependencies = await Promise.all(decodedTransaction.inputs.map((input) => getTransaction(binToHex(input.outpointTransactionHash))));

        // Output the raw hex-encoded funding transaction to the console.
        console.log(`Funding transaction: ${fundingTransaction}`);

        // Send the funding transaction to the settlement service for validation and broadcasting.
        await anyHedgeManager.submitFundingTransaction(contractData.address, fundingTransaction, dependencies);

        // Log the next steps.
        var text_message = `Generated contract address ${contractData.address}. Wait for ${CONTRACT_DURATION_IN_SECONDS} seconds(s) and the redemption service should mature your contract, paying out to short (${shortPayoutAddress}) and long (${longPayoutAddress}).`
        var message = { "message": text_message }

        return message
    }
    catch (error) {
        var text_message = error.toString()
        var message = { "message": text_message }
        return message
    }

}

export { create_p2p_contract };
