// Function to get query parameters from URL
function downloadTextFile(text, filename) {
    // Create a Blob containing the text
    const blob = new Blob([text], { type: 'text/plain' });

    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a link element
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Append the link to the body
    document.body.appendChild(a);

    // Programmatically click the link to trigger the download
    a.click();

    // Clean up: remove the link and revoke the URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

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


function getQueryParams() {
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

const contract_address = getQueryParams()


async function get_proposal() {

    // Response elements
    const GenPop = document.getElementById('GenProp');
    const GenPopContent = document.getElementById('GenPropContent');
    setResponseMessage(GenPop, GenPopContent, "", false)


    const url = '/get_proposal'
    const element = document.getElementById('priceInput');
    const price = element.value;

    let endpointUrl = ''
    if (price !== '') {
        console.log("Price found")
        let price_int = Number(price) * 100
        endpointUrl = `${url}?c_address=${encodeURIComponent(contract_address)}&price=${encodeURIComponent(price_int)}`;

    }
    else {
        console.log("No price found")
        endpointUrl = `${url}?c_address=${encodeURIComponent(contract_address)}`;
    }

    const response = await fetch(endpointUrl);
    proposal = await response.json()


    let message = ""
    if ('message' in proposal) {
        message = proposal['message']
    } else {
        message = "The proposal was generated, check the downloaded file."
        encoded_proposal = encodeExtendedJson(proposal)
        downloadTextFile(encoded_proposal, `${contract_address}_proposal.json`)
    }
    setResponseMessage(GenPop, GenPopContent, message, true)


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
        endpointUrl = `${url}?cont_ad=${encodeURIComponent(contract_address)}&own_p=${encodeURIComponent(own_proposal)}&cont_p=${encodeURIComponent(cnt_proposal)}`;

        const response = await fetch(endpointUrl);
        response_message = await response.json()
        console.log(response_message['message'])
        setResponseMessage(CMutualRed, CMutualRedContent, response_message['message'], true)

    }

}
