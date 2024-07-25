import express from 'express';
import path from 'path';
import morgan from 'morgan';
import favicon from 'serve-favicon'

import { get_status, get_info_for_contract_addresses, signMutualRedemption, completeMutualRedemption } from './utils/anyhedge_functions.js';
import { encodeExtendedJson, decodeExtendedJson } from './utils/encoder.js'

const app = express();
const port = 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);


app.use(morgan('dev'));

app.use(favicon(__dirname + '/assets/bch.webp'));

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
app.get('/act_cont_script', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/active_contracts', 'active_cont.js'));
});
app.get('/settle_script', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/settle_options', 'settle_options.js'));
});


// Functionality endpoints
app.get('/get_proposal', async (req, res) => {

    const contract_address = req.query.c_address;
    const price = req.query.price

    let big_int_price = undefined
    if (price !== undefined) {
        big_int_price = BigInt(req.query.price);
    }


    // Call your function with the extracted parameters
    let response = await signMutualRedemption(contract_address, big_int_price);
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
    let response = await completeMutualRedemption(contract_address, dec_own_proposal, dec_count_proposal);
    console.log(response)

    // Send a response back
    res.send(response);
});

app.get('/get_contract_status', async (req, res) => {
    const c_address = req.query.param1;

    // Call your function with the extracted parameters
    let response = await get_status(c_address);
    // console.log(response)
    // Send a response back
    res.send(response);
});


app.get('/get_active_cont_data', async (req, res) => {

    // Call your function with the extracted parameters
    let response = await get_info_for_contract_addresses();
    // console.log(typeof response)
    // Send a response back
    res.send(response);
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
