
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



function show_text(txt_info_id) {
    const textBox = document.getElementById(txt_info_id);
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
    let usd_value = (object.metadata.nominalUnits / 100).toFixed(2)
    let type = object.metadata.takerSide
    let seconds = Number(object.metadata.durationInSeconds)
    let duration_text = ""
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

    let resultString = `USD Value: ${usd_value} ${duration_text} Type: ${type}`;


    return resultString
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

            let info_text = build_text_info(item)
            txt_info.innerText = info_text

            const btn_info = document.createElement('button');
            btn_info.id = "info".concat(item.address);
            btn_info.innerText = "i";
            btn_info.className = "button-black-border"


            btn_info.addEventListener('click', function () {
                show_text(txt_info.id);
            });



            divA.appendChild(btn_info);
            divA.appendChild(btn);
            divB.appendChild(txt_info);

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





