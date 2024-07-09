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
    window.location.href = 'settle_options.html?' + queryString;
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

async function fetchData() {
    try {
        const response = await fetch('http://localhost:3000/get_active_cont_data');
        enc_data = await response.json()

        data = decodeExtendedJsonObject(enc_data)
        console.log(data)

        const element = document.getElementById('contracts');



        data.forEach((item, idx) => {
            const divA = document.createElement('div');
            divA.id = "div_a".concat(item.address)
            divA.className = "container"
            const divB = document.createElement('div');
            divB.id = "div_b".concat(item.address)
            divB.className = "container"
            element.appendChild(divA);
            element.appendChild(divB);


            const btn = document.createElement('button');
            btn.id = item.address;
            btn.innerText = item.address;
            btn.className = "button-black-border"

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

            btn.addEventListener('click', function () {
                open_settle_page(item.address);
            });

            divA.appendChild(btn_info);
            divA.appendChild(btn);
            divB.appendChild(txt_info);



        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetchData();