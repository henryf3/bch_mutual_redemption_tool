function getContAddress() {
    let params = {};
    let queryString = window.location.search.substring(1);
    let pairs = queryString.split('&');
    for (let i = 0; i < pairs.length; i++) {
        let pair = pairs[i].split('=');
        if (pair.length === 2) {
            let key = decodeURIComponent(pair[0]);
            let value = decodeURIComponent(pair[1]);
            params[key] = value;
        }
    }
    let contract_address = params.contract_id
    return contract_address
}

const contract_address = getContAddress()


function setResponseMessage(father, content, message, show) {
    //put custom text
    content.innerText = message;

    // Show/hide father 
    if (show) {

        father.classList.remove('hidden');
    } else {
        father.classList.add('hidden');

    }

}


function loadOwnProposal() {
    const fileInput = document.getElementById('OwnProposal');
    const file = fileInput.files[0]; // Get the first file selected by the user


    if (file) {
        const reader = new FileReader();

        // Setup onload event for reader
        reader.onload = function (event) {
            const fileText = event.target.result; // This is the text content of the file
            console.log(fileText)
            // Display the file content in a div
            const fileContentDiv = document.getElementById('OwnProposalContent');
            fileContentDiv.textContent = fileText;
        };

        // Read file as text
        reader.readAsText(file);
    } else {
        alert('No file selected');
    }
}

function loadCounterProposal() {
    const fileInput = document.getElementById('CounterProposal');
    const file = fileInput.files[0]; // Get the first file selected by the user


    if (file) {
        const reader = new FileReader();

        // Setup onload event for reader
        reader.onload = function (event) {
            const fileText = event.target.result; // This is the text content of the file
            console.log(fileText)
            // Display the file content in a div
            const fileContentDiv = document.getElementById('CounterProposalContent');
            fileContentDiv.textContent = fileText;
        };

        // Read file as text
        reader.readAsText(file);
    } else {
        alert('No file selected');
    }
}




async function complete_mutual_redemption() {

    const CMutualRed = document.getElementById('CMutualRed');
    const CMutualRedContent = document.getElementById('CMutualRedContent');
    setResponseMessage(CMutualRed, CMutualRedContent, "", false)

    const url = '/completeMutualRedemption'

    let own_proposal = document.getElementById('OwnProposalContent').textContent;
    let cnt_proposal = document.getElementById('CounterProposalContent').textContent;


    if (own_proposal === '' || cnt_proposal === '') {
        alert('You need to load two files');
    }

    else {
        const spinner = document.getElementById('spinner');
        spinner.classList.remove('hidden');

        div_form = document.getElementById('main_container');
        div_form.classList.add('hidden')

        endpointUrl = `${url}?cont_ad=${encodeURIComponent(contract_address)}&own_p=${encodeURIComponent(own_proposal)}&cont_p=${encodeURIComponent(cnt_proposal)}`;
        const response = await fetch(endpointUrl);
        response_message = await response.json()
        console.log(response_message['message'])
        spinner.classList.add('hidden')
        setResponseMessage(CMutualRed, CMutualRedContent, response_message['message'], true)

    }
}
