# BchBull Contingency Settlement Tool

## Testing Setup 

### Getting credentials

#### Getting an authentication token 
```
curl -d 'name=My name' "https://api.anyhedge.com/api/v2/requestToken"
```
The name can be anything.

#### Getting Private keys:
Next step involves a Private Key from your wallet, which you should absolutely leave alone outside of worst case disaster scenarios. 
Strongly advised steps to take PRIOR TO dealing with your private keys:
1. If possible do it on a freshly installed Linux desktop, if not:
2. Uninstall any cracked software
3. Remove intrusive OS “features”, e.g. Windows10 / Mac Keyloggers & etc.
4. Run a full malware / spyware scan (e.g. Malwarebytes scan including rootkits)
5. Run a full virus scan (e.g. housecall.trendmicro.com)
6. Work in a private physical space
7. DO NOT use this private key anymore after contract settlement process, i.e. migrate the funds to another address.


#### Steps to get a Private Key associated with enough funds for Contract Settlement + expected NetworkFees.
1. In electron cash wallet, and use the Addresses tab.
<img src="assets/project_use/electroncash.jpg" alt="Eletron Cash">

2. Copy private key of an address with enough funds for bchbull contract settlement and expected network fees.
<img src="assets/project_use/privatekey.jpg" alt="Private Key">


### Using the project (bchbull contingency tool)

#### a. Local Mode .
- Clone the repository
 ```
git clone https://github.com/henryf3/bch_mutual_redemption_tool.git
```

- Run the commands in terminal
 ```
npm install
npm start
```
#### b. Web Mode (NOTHING is SAVED on the Server End)

I need to stress that NOTHING IS SAVED from the web interface.
Just open the web page: 

```
https://bchmutualredemption.adaptable.app/
```

### Test Process

#### I. First you will need to create a p2p contract

##### The form
In this screen you need to add the following information:

- Nominal Units: amount in USD cents for the contract.
- Contract duration in seconds: time in seconds the contract will have.
- Low liquidation multiplier. 
- High liquidation multiplier.
- Peer1_short_private_key: key of the short side.
- Peer2_long_private_key: key of the long side.
- Authentication Token: token for AnyHedge API


<img src="assets/project_use/p2p_form.png" alt="P2P Form">

 
Once you have this information you can use the `Send` button to create a contract, a message will appear here.

<img src="assets/project_use/response_p2p.png" alt="Response P2P">

##### See active contracts

For testing purposes you can create a file called `p2p_testing.csv` and put the following information, here we are using the contractAddress of the contract generated in the p2p option. Here we are replicating the column names of the csv file given by BCHBULL in the export function

**`p2p_testing.csv`**
```
contractAddress,settlementTxId
bitcoincash:pwgp9nq94d4lx2fwd8v27nlkkr7q6p360h2rch7c4x3ewj83pg8yzrhc5z58s,
```

Or you can use the csv file provided by bchbull.


#### Contingency Settlement Tool

##### a. Adding credentials

Here you need to add your Authorization token and your Private Keys from the earlier step (getting credentials). 
Repeat of STRONGLY ADVISED steps to take PRIOR TO dealing with funded Private Keys: 
1. If possible do it on a freshly installed Linux desktop, if not:
2. Uninstall any cracked software
3. Remove intrusive OS “features”, e.g. Windows10 / Mac Keyloggers & etc.
4. Run a full malware / spyware scan (e.g. Malwarebytes scan including rootkits)
5. Run a full virus scan (e.g. housecall.trendmicro.com)
6. Work in a private physical space
7. DO NOT use this private key anymore after contract settlement process, i.e. migrate the funds to another address.

<img src="assets/tool/active_cred.png" alt="Active Credentials">

#### b. Loading .csv file
Here you need to load your csv file with the contracts information

<img src="assets/tool/options_load_csv.png" alt="Load csv">



#### c. Review active contract(s)
<img src="assets/tool/main_scr.png" alt="Main screen">

Here you can see the list of contracts that are active currently (from the list in csv option they are filtered checking the ones without settlement information). You can click in one of them to check the settlement utilities.

#####  C.1. Settle utilities
In this page, you have two sections, one to generate the Mutual Redemption proposal, and another to load the
generated proposals to complete the mutual redemption.

###### Generate proposal
<img src="assets/tool/generate_proposal.png" alt="Generate proposal">
In this section you can generate a proposal entering a price in USD, or you can leave it blank to ask for a refund.
When clicking the button, it will download a file.

File example for a refund (no price specified):

**`bitcoinXXXXX.json`**
```
{
    "inputs": [
        {
            "txid": "4ff149908a2c3554abef8e72b7434137e15d4edfebd57ebc704ca3bcb280d341",
            "vout": 0,
            "satoshis": "<bigint: 73814n>"
        }
    ],
    "outputs": [
        {
            "to": "bitcoincash:qqjmrnma2drlc5xp4uy3gc0muknrv265pqhzp2ez0m",
            "amount": "<bigint: 53888n>"
        },
        {
            "to": "bitcoincash:qpq4wdvz4jfrfhnt9trtgnyvqgmfcmyq2vummy8yjd",
            "amount": "<bigint: 17961n>"
        }
    ],
    "redemptionDataList": [
        {
            "short_key.schnorr_signature.all_outputs": "e33c66d6d26ee469e169a5a232432930606e1929631e120d7821e9e1f3240629dcd6bdc9a093aa135fac9290901fb3006ce54698fa3ad4a02890e9c005a90f4f41"
        }
    ]
}
```

You can replicate this step, but using the other private key (either short or long side),
so you can have the two files for the next section, update your `.env` file updating the PRIVATE_KEY information.

###### Completing mutual redemption.

<img src="assets/tool/complete_mr.png" alt="Complete mutual redemption">

In this section you need to load both proposal (own and counterparty), to complete a mutual redemption.
Once loaded the files, you can press the button `Complete Mutual redemption`.

The page will show a message indicating that the redemption was succesful, and you can check 
your balance in your testing wallets to check that the funds were refunded.

<img src="assets/tool/message_mr.png" alt="Mutual redemption message">



## Implementation Guide

### Prerequisites:

- Have Early Settlement enabled for your contracts in your account.
<img src="assets/bch_bull/early_settlement.png" alt="Early settlement enabled">


- Always have your BchBULL Contract Details backed up

    You need to keep this file as updated as possible (maybe try to get a new file version every time after generating a new contract). 

<img src="assets/bch_bull/export.png" alt="Export function">

- Have your BchBULL Private Key backed up

<img src="assets/bch_bull/privatekey.png" alt="Private key">



- Get your credentials

    #### Getting an authentication token 
    ```
    curl -d 'name=My name' "https://api.anyhedge.com/api/v2/requestToken"
    ```
    The name can be anything.

    #### Getting Private keys:
    This involves the Private Key from your BCHBull account associated with the to-be-settled-BchBull Contract. This is the PrivateKey of the account utilized when you created this particular BchBull Contract.
    Strongly advised steps to take PRIOR TO dealing with your private keys:
    1. If possible do it on a freshly installed Linux desktop, if not:
    2. Uninstall any cracked software
    3. Remove intrusive OS “features”, e.g. Windows10 / Mac Keyloggers & etc.
    4. Run a full malware / spyware scan (e.g. Malwarebytes scan including rootkits)
    5. Run a full virus scan (e.g. housecall.trendmicro.com)
    6. Work in a private physical space
    7. DO NOT use this private key anymore after contract settlement process, i.e. migrate the funds to another address.

### Using the BchBull Contingency Settlement Tool

#### I. Choose Local or Web mode

##### a. Local Mode .
- Clone the repository
 ```
git clone https://github.com/henryf3/bch_mutual_redemption_tool.git
```

- Run the commands in terminal
 ```
npm install
npm start
```
##### b. Web Mode (NOTHING is SAVED on the Server End)

I need to stress that NOTHING IS SAVED from the web interface. That said, it is strongly advised that you create and use a new BchBull account after this settlement process.

Just open the web page: 

```
https://bchmutualredemption.adaptable.app/
```

#### II. Use the option 'See active contracts' from the main menu

<img src="assets/bch_bull/menu.png" alt="Menu active contracts">


#### III. Input your credentials
<img src="assets/bch_bull/creds.png" alt="Creds active contracts">
Here you need to add:

- Authorization token: See Prerequisites for guide.
- Your BchBUll Account Private key: the private key that you get in the Account section of BCHBUll (must be the same account where you generated the contracts and downloaded the csv file.) 

A quick reminder of the to-do list prior to dealing with private keys: 
1. If possible do it on a freshly installed Linux machine, if that is not available:
2. Uninstall any cracked software
3. Remove intrusive OS “features”, e.g. Windows10 / Mac Keyloggers & etc.
4. Run a full malware / spyware scan (e.g. Malwarebytes scan including rootkits)
5. Run a full virus scan (e.g. housecall.trendmicro.com)
6. Work in a private physical space
7. DO NOT use this private key anymore after contract settlement process, i.e. migrate the funds to another address.


#### IV. Load your csv file 
Here you need to load the csv file downloaded from Export funcion from BCHBull.

<img src="assets/bch_bull/loadcsv.png" alt="Load csv bchbull">

#### V. Generate your own mutual redemption proposal.
In this screen you need to select the contract you want to generate a proposal.

<img src="assets/bch_bull/select_cont.png" alt="Select contract">

<img src="assets/bch_bull/generate_prop.png" alt="Generate proposal">

In this screen you need to specify a price (the one accorded with the Liquidity provider, or leave it blank if you want to propose a refund)

<img src="assets/bch_bull/generate_prop_price.png" alt="Generate proposal price">

When you pulse generate, a file will be downloaded in your pc.

<img src="assets/bch_bull/proposal_generated.png" alt="File generated">

#### VI. Share your proposal with the Liquidity provider.

Now, you just need to share your proposal with your liquidity provider so they can:

- A. Generate their counterparty proposal (using the option explained in the previous lines)
- B. Complete the mutual redemption, following the steps provided in [section](#completing-mutual-redemption).
