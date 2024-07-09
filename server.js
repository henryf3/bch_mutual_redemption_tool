import express from 'express';
import path from 'path';
import morgan from 'morgan';
import favicon from 'serve-favicon'
import bodyParser from 'body-parser';
import open from 'open';
import { get_info_for_contract_addresses, signMutualRedemption, completeMutualRedemption } from './utils/anyhedge_functions.js';
import { create_p2p_contract } from './utils/p2p_contracts_using_ui.js';

import { decodeExtendedJson } from './utils/encoder.js'
import { create } from 'domain';

const app = express();
const port = 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);


app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(favicon(__dirname + '/assets/bch.webp'));


var authentication_token;
var private_key;
app.post('/submit_keys', async (req, res) => {
    authentication_token = req.body.atoken;
    private_key = req.body.pkey;
    console.log(authentication_token)
    res.send({ "message": "Received succesfully" });
});


// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

//Utilities 
app.get('/encoder', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/utils', 'web_page_encoder.js'));
});

// RENDER HTML PAGES
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/act_cont', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/active_contracts', 'active_cont.html'));
});

app.get('/p2p_contract', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/p2p_contract', 'p2p_contract.html'));
});

// SCRIPT FILES 
app.get('/idx_script', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.js'));
});
app.get('/p2p_script', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/p2p_contract', 'p2p_contract.js'));
});
app.get('/act_cont_script', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/active_contracts', 'active_cont.js'));
});
// Settle options
app.get('/menu_settle_opts_script', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/settle_options', 'menu.js'));
});
app.get('/generate_pro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/settle_options', 'generate_proposal.js'));
});
app.get('/mut_red', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/settle_options', 'mutual_redemption.js'));
});

// Functionality endpoints
app.post('/submit_p2p', async (req, res) => {
    // authentication_token = req.body.atoken;
    // private_key = req.body.pkey;
    let data = req.body
    let response = await create_p2p_contract(data);
    console.log(response)

    // Send a response back
    res.send(response);
});

app.get('/get_proposal', async (req, res) => {

    const contract_address = req.query.c_address;
    const price = req.query.price

    let big_int_price = undefined
    if (price !== undefined) {
        big_int_price = BigInt(req.query.price);
    }


    // Call your function with the extracted parameters
    let response = await signMutualRedemption(authentication_token, private_key, contract_address, big_int_price);
    // console.log(response)
    // Send a response back
    res.send(response);
});


app.get('/completeMutualRedemption', async (req, res) => {
    const contract_address = req.query.cont_ad;
    const own_proposal = req.query.own_p;
    const counter_proposal = req.query.cont_p
    const dec_own_proposal = decodeExtendedJson(own_proposal)
    const dec_count_proposal = decodeExtendedJson(counter_proposal)
    let response = await completeMutualRedemption(authentication_token, private_key, contract_address, dec_own_proposal, dec_count_proposal);
    console.log(response)

    // Send a response back
    res.send(response);
});


app.post('/get_active_cont_data', async (req, res) => {

    const cont_ls = req.body.data;
    let response = await get_info_for_contract_addresses(authentication_token, private_key, cont_ls);

    res.send(response);
});


// Start the server
app.listen(port, () => {
    open('http://localhost:3000/')
    console.log(`Server is running at http://localhost:${port}`);
});
