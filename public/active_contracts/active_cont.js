
document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('keys_form').addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent the default form submission


        const atokenInput = document.getElementById('atoken');
        const atoken = atokenInput.value;

        const pkeyInput = document.getElementById('pkey');
        const pkey = pkeyInput.value;

        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = '';
        // Define the minimum and maximum length
        const minLength = 50;
        const maxLength = 70;

        // Validate the length of the username
        if (atoken.length < minLength || atoken.length > maxLength) {
            errorMessage.textContent = `Authorization token must be between ${minLength} and ${maxLength} characters.`;
            return;
        }
        if (pkey.length < minLength || pkey.length > maxLength) {
            errorMessage.textContent = `Private key must be between ${minLength} and ${maxLength} characters.`;
            return;
        }

        const form = event.target;
        const formData = new FormData(form);

        const data = {};
        formData.forEach((value, key) => (data[key] = value));

        // console.log(data)

        try {
            const response = await fetch('/submit_keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }

            const file_form = document.getElementById('file_form');
            file_form.classList.remove("hidden")

            const creds_cont = document.getElementById('container_form');
            creds_cont.classList.add("hidden")

            const result = await response.json();
            console.log('Success:', result);
        } catch (error) {
            console.error('Error:', error);
        }
    });
});

let oracleUnitsPerCommonUnitLookup = {
    // US Dollars / Bitcoin Cash
    '02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818': 100,
    // Euros / Bitcoin Cash
    '02bb9b3324df889a66a57bc890b3452b84a2a74ba753f8842b06bba03e0fa0dfc5': 100,
    // Chinese Yuan / Bitcoin Cash
    '030654b9598186fe4bc9e1b0490c6b85b13991cdb9a7afa34af1bbeee22a35487a': 100,
    // Indian Rupee / Bitcoin Cash
    '02e82ad82eb88fcdfd02fd5e2e0a67bc6ef4139bbcb63ce0b107a7604deb9f7ce1': 1,
    // Gold / Bitcoin Cash
    '021f8338ccd45a7790025de198a266f252ac43c95bf81d2469feff110beeac89dd': 100000,
    // Silver / Bitcoin Cash
    '02712c349ebb7555b17bdbbe9f7aad5a337fa4179d0680eec3f6c8d77bac9cfa79': 1000,
    // Bitcoin / Bitcoin Cash
    '0245a107de5c6aabc9e7b976f26625b01474f90d1a7d11c180bec990b6938e731e': 1000000,
    // Ethereum / Bitcoin Cash
    '038ab22e37cf020f6bbef40111ddc51083a936f0821de56ac01f799cf15b87904d': 100000,
};

let asset = {
    // US Dollars / Bitcoin Cash
    '02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818': 'USD',
    // Euros / Bitcoin Cash
    '02bb9b3324df889a66a57bc890b3452b84a2a74ba753f8842b06bba03e0fa0dfc5': 'EUR',
    // Chinese Yuan / Bitcoin Cash
    '030654b9598186fe4bc9e1b0490c6b85b13991cdb9a7afa34af1bbeee22a35487a': 'CNY',
    // Indian Rupee / Bitcoin Cash
    '02e82ad82eb88fcdfd02fd5e2e0a67bc6ef4139bbcb63ce0b107a7604deb9f7ce1': 'INR',
    // Gold / Bitcoin Cash
    '021f8338ccd45a7790025de198a266f252ac43c95bf81d2469feff110beeac89dd': 'XAU',
    // Silver / Bitcoin Cash
    '02712c349ebb7555b17bdbbe9f7aad5a337fa4179d0680eec3f6c8d77bac9cfa79': 'XAG',
    // Bitcoin / Bitcoin Cash
    '0245a107de5c6aabc9e7b976f26625b01474f90d1a7d11c180bec990b6938e731e': 'BTC',
    // Ethereum / Bitcoin Cash
    '038ab22e37cf020f6bbef40111ddc51083a936f0821de56ac01f799cf15b87904d': 'ETH',
};

function show_text(object_id) {
    const textBox = document.getElementById(object_id);
    if (textBox.classList.contains('hidden')) {
        textBox.classList.remove('hidden');
    } else {
        textBox.classList.add('hidden');
    }
}

function open_settle_page(contract_address) {
    let dataToSend = {
        contract_id: contract_address
    };
    let queryString = Object.keys(dataToSend).map(key => key + '=' + encodeURIComponent(dataToSend[key])).join('&');
    window.location.href = 'settle_options/menu.html?' + queryString;
}

function build_text_info(object) {

    let start_date = new Date(Number(object.parameters.startTimestamp) * 1000).toLocaleString("en-GB")
    let maturity_date = new Date(Number(object.parameters.maturityTimestamp) * 1000).toLocaleString("en-GB")
    let type = object.metadata.takerSide

    let value_to_select = undefined
    if (type === 'short') {
        value_to_select = 'shortInputInOracleUnits'
    } else {
        value_to_select = 'longInputInOracleUnits'
    }

    let units_to_analyze = object.metadata[value_to_select]
    let oracle_public_key = object.parameters.oraclePublicKey;
    let conversion_factor = oracleUnitsPerCommonUnitLookup[oracle_public_key]
    let units_original_asset = (units_to_analyze / conversion_factor).toFixed(5)
    let original_asset = asset[oracle_public_key]


    let seconds = Number(object.metadata.durationInSeconds)
    let duration_text = undefined

    if (seconds > 86400) {
        duration_text = `Duration: ${(seconds / 86400).toFixed(2)} days`
    }
    else if (seconds > 3600) {
        duration_text = `Duration: ${(seconds / 3600).toFixed(2)} hours`
    }
    else if (seconds > 60) {
        duration_text = `Duration: ${(seconds / 60).toFixed(2)} minutes`
    }
    else {
        duration_text = `Duration: ${seconds} seconds`
    }

    let resultString = `${duration_text} | Type: ${type}`;
    let dateString = `Start Date: ${start_date} | Maturity Date: ${maturity_date}`
    let original_values = `Currency/asset: ${original_asset} | Amount: ${units_original_asset}`

    return { "txt_info": resultString, "date_info": dateString, "original_values": original_values }
}

function fetchData(data) {


    try {

        const f_title = document.getElementById('section0');
        const f_contracts = document.getElementById('section1');
        const f_no_set_contracts = document.getElementById('section2');

        const contracts = document.getElementById('contracts');
        const no_set_contracts = document.getElementById('no_settlement_contracts');

        let cont_cnt = 0
        let no_set_cont_cnt = 0

        data.forEach((item, idx) => {
            const divA = document.createElement('div');
            divA.id = "div_a".concat(item.address)
            divA.className = "container"
            const divB = document.createElement('div');
            divB.id = "div_b".concat(item.address)
            divB.className = "container"



            const btn = document.createElement('button');
            btn.id = item.address;
            btn.innerText = item.address;


            const txt_info = document.createElement('text');
            txt_info.id = "txt_info".concat(item.address);
            txt_info.className = "textbox hidden"

            const date_info = document.createElement('text');
            date_info.id = "date_info".concat(item.address);
            date_info.className = "textbox hidden"

            const orig_currency = document.createElement('text');
            orig_currency.id = "orig_currency".concat(item.address);
            orig_currency.className = "textbox hidden"

            let result_text = build_text_info(item)
            txt_info.innerText = result_text["txt_info"]
            date_info.innerText = result_text["date_info"]
            orig_currency.innerText = result_text["original_values"]


            const btn_info = document.createElement('button');
            btn_info.id = "info".concat(item.address);
            btn_info.innerText = "i";
            btn_info.className = "button-black-border"

            let separator = document.createElement('div');
            separator.id = "sep".concat(item.address);
            separator.className = "hidden"
            separator.style.width = '1px';
            separator.style.height = '15px'; // Adjust the height to match your buttons

            let separator_2 = document.createElement('div');
            separator_2.id = "sep2".concat(item.address);
            separator_2.className = "hidden"
            separator_2.style.width = '1px';
            separator_2.style.height = '15px'; // Adjust the height to match your buttons

            btn_info.addEventListener('click', function () {
                show_text(txt_info.id);
                show_text(separator.id);
                show_text(orig_currency.id);
                show_text(separator_2.id);
                show_text(date_info.id);
            });

            divA.appendChild(btn_info);
            divA.appendChild(btn);
            divB.appendChild(txt_info);
            divB.appendChild(separator);
            divB.appendChild(orig_currency);
            divB.appendChild(separator_2);
            divB.appendChild(date_info);

            if (item.parameters.enableMutualRedemption === BigInt(1n)) {
                cont_cnt += 1
                contracts.appendChild(divA);
                contracts.appendChild(divB);
                btn.addEventListener('click', function () {
                    open_settle_page(item.address);
                });
                btn.className = "button-black-border"
            } else {
                no_set_cont_cnt += 1
                no_set_contracts.appendChild(divA);
                no_set_contracts.appendChild(divB);
                btn.className = "button-black-border_2"

            }


        });

        const spinner = document.getElementById('spinner');
        spinner.classList.add('hidden');

        if (cont_cnt > 0) {
            f_contracts.classList.remove('hidden');
        }
        if (no_set_cont_cnt > 0) {
            f_no_set_contracts.classList.remove('hidden');
        }

        if (cont_cnt === 0 & no_set_cont_cnt === 0) {
            f_title.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


function csvToArray(str, delimiter = ",") {

    // slice from start of text to the first \n index
    // use split to create an array from string by delimiter
    const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

    // slice from \n index + 1 to the end of the text
    // use split to create an array of each csv value row
    const rows = str.slice(str.indexOf("\n") + 1).split("\n");

    // Map the rows
    // split values from each row into an array
    // use headers.reduce to create an object
    // object properties derived from headers:values
    // the object passed as an element of the array
    const arr = rows.map(function (row) {
        const values = row.split(delimiter);
        const el = headers.reduce(function (object, header, index) {
            object[header] = values[index];
            return object;
        }, {});
        return el;
    });

    // return the array
    return arr;
}

function load_data_from_csv() {
    const file_form = document.getElementById('file_form');
    const csvFile = document.getElementById('csvFile');
    const input = csvFile.files[0];
    const reader = new FileReader();

    reader.onload = async function (e) {
        const text = e.target.result;
        const data = csvToArray(text);

        let contract_ads = []
        let i = 0
        while (i < data.length) {
            if (data[i]['settlementTxId'] == '') {
                contract_ads.push(data[i]['contractAddress'])
            }
            i++;
        }

        const url = '/get_active_cont_data'



        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: contract_ads }),
        })

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const response_data = await response.json();



        fetchData(decodeExtendedJsonObject(response_data))

    };

    reader.readAsText(input);
    file_form.classList.add('hidden')
    const spinner = document.getElementById('spinner');
    spinner.classList.remove('hidden');
}





