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

let dataToSend = {
    contract_id: contract_address
};
let queryString = Object.keys(dataToSend).map(key => key + '=' + encodeURIComponent(dataToSend[key])).join('&');


function goMutRedGenProp() {
    window.location.href = 'generate_proposal.html?' + queryString;
}

function goComMutRed() {
    window.location.href = 'mutual_redemption.html?' + queryString;
}
