import { AnyHedgeManager } from '@generalprotocols/anyhedge';
import { encodeExtendedJson, encodeExtendedJsonObject } from './encoder.js'


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

const get_status = async function (contract_address, manager, private_key) {
    const contractData = await manager.getContractStatus(contract_address, private_key);

    // Output the contract status to the console
    // console.log('contract data:');
    // console.log(contractData);

    // Settlement details, if any:
    const settlementData = contractData.fundings[0]?.settlement;
    // if (settlementData) {
    //     console.log('contract data settlement details:');
    //     console.log(settlementData);
    // }
    // console.log(contractData)
    let value = contractData;
    return value
};


async function get_info_for_contract_addresses(a_token, p_key, contracts_ls) {
    const manager = create_manager(a_token)

    let i = 0;

    let c_data = []
    while (i < contracts_ls.length) {
        // console.log(contracts_ls[i]);
        let cont_address = contracts_ls[i]
        try {
            console.log("Estatus for contract:", cont_address)
            let data = await get_status(cont_address, manager, p_key)

            // console.log(data['fundings'][0]['settlement'])
            // ## Just keep the contracts without settlement
            if (data['fundings'][0]['settlement'] === undefined) {
                c_data.push(data)
                console.log(data['fundings'][0]['settlement'])

            }

        } catch (error) {
            // Log the error to the console.
            console.error('Error:', error.message);
        }
        console.log(c_data)
        i++;
    }
    return encodeExtendedJsonObject(c_data)
}


const signMutualRedemption = async function (authentication_token, privateKeyWIF, contractAddress, settlementPrice) {

    const manager = create_manager(authentication_token)
    try {

        // Retrieve contract data for the contract address.
        const contractData = await manager.getContractStatus(contractAddress, privateKeyWIF);

        // Extract the parameters and metadata for legibility.
        const { parameters: contractParameters } = contractData;
        const { metadata: contractMetadata } = contractData;

        // Take the first contract funding in the list.
        const contractFunding = contractData.fundings[0];


        // Throw an error if no contract funding was found.
        if (typeof contractFunding === 'undefined') {
            throw (new Error(`No funding found for contract address ${contractAddress}`));
        }

        let proposal;

        if (typeof settlementPrice !== 'undefined') {
            // Perform a mutual early maturation if a settlement price was provided.
            proposal = await manager.signMutualEarlyMaturation({ privateKeyWIF, contractFunding, settlementPrice, contractParameters, contractMetadata });
        }
        else {
            // Perform a refund if no settlement price was provided.
            proposal = await manager.signMutualRefund({ privateKeyWIF, contractFunding, contractParameters, contractMetadata });
            // console.log(proposal)
        }

        // Log the results to the console.
        return encodeExtendedJson(proposal);
    }
    catch (error) {
        // Log the error to the console and exit.
        console.error(error.message);
        return { "message": error.message }
    }
};


const completeMutualRedemption = async function (authentication_token, privateKeyWIF, contractAddress, proposal1, proposal2) {
    const manager = create_manager(authentication_token)
    try {
        // Retrieve contract data for the contract address.
        const contractData = await manager.getContractStatus(contractAddress, privateKeyWIF);

        // Complete mutual redemption.
        const transactionId = await manager.completeMutualRedemption(proposal1, proposal2, contractData.parameters);

        // Log the results to the console.
        console.log('Successfully completed mutual redemption with this transaction:');
        console.log();
        console.log(transactionId);
        return {
            "message": `Successfully completed mutual redemption with this transaction: ${transactionId}`
        }
    }
    catch (error) {
        // Log the error to the console and exit.
        console.error(error.message);
        return { "message": error.message }
    }
};



export { get_status, get_info_for_contract_addresses, signMutualRedemption, completeMutualRedemption };
