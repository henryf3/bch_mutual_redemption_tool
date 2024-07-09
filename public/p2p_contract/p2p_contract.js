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
document.addEventListener('DOMContentLoaded', (event) => {
    div_form = document.getElementById('container_form');
    div_form.classList.remove('hidden')
    document.getElementById('p2p_form').addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent the default form submission

        const spinner = document.getElementById('spinner');
        spinner.classList.remove('hidden');

        div_form = document.getElementById('container_form');
        div_form.classList.add('hidden')

        // Response elements
        const P2pResponse = document.getElementById('P2pResponse');
        const P2pResponseContent = document.getElementById('P2pResponseContent');
        setResponseMessage(P2pResponse, P2pResponseContent, "", false)


        const input_nom_units = document.getElementById('nom_units');
        const nom_units = input_nom_units.value;

        const input_cont_dur_insec = document.getElementById('cont_dur_insec');
        const cont_dur_insec = input_cont_dur_insec.value;

        const input_low_liq_mult = document.getElementById('low_liq_mult');
        const low_liq_mult = input_low_liq_mult.value;

        const input_hig_liq_mult = document.getElementById('hig_liq_mult');
        const hig_liq_mult = input_hig_liq_mult.value;

        const input_p1_short_key = document.getElementById('p1_short_key');
        const p1_short_key = input_p1_short_key.value;

        const input_p2_long_key = document.getElementById('p2_long_key');
        const p2_long_key = input_p2_long_key.value;

        const input_auth_token = document.getElementById('auth_token');
        const auth_token = input_auth_token.value;

        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = '';

        //Validate max and min units
        if (nom_units > 100000000 || nom_units < 10) {
            errorMessage.textContent = `Nominal Units must be Higher than 9 and less than 100000001.`;
            return;
        }

        //Validate CONTRACT_DURATION_IN_SECONDS
        secs_time = 120
        if (cont_dur_insec < secs_time) {
            errorMessage.textContent = `The duration of the contract must be greater than ${secs_time}`;
            return;
        }

        //Validation LOW_LIQUIDATION_MULTIPLIER
        low_mult = 0.20
        if (low_liq_mult < low_mult) {
            errorMessage.textContent = `The min low liquidation must be higher than ${low_mult}`;
            return;
        }

        //Validation HIGH_LIQUIDATION_MULTIPLIER
        high_mult = 2.00
        if (hig_liq_mult > high_mult) {
            errorMessage.textContent = `The high liquidation multiplier must be less than ${high_mult}`;
            return;
        }

        //Keys validation 
        min_key_length = 50
        max_key_length = 70
        if (p1_short_key.length < min_key_length || p1_short_key.length > max_key_length) {
            errorMessage.textContent = `Short private key must be between  ${min_key_length} and ${max_key_length} characters`;
            return;
        }

        if (p2_long_key.length < min_key_length || p2_long_key.length > max_key_length) {
            errorMessage.textContent = `Long private key must be between  ${min_key_length} and ${max_key_length} characters`;
            return;
        }

        //Validation AUTH_TOKEN
        if (auth_token.length < min_key_length || auth_token.length > max_key_length) {
            errorMessage.textContent = `Authentication token must be between  ${min_key_length} and ${max_key_length} characters`;
            return;
        }

        const form = event.target;
        const formData = new FormData(form);

        const data = {};
        formData.forEach((value, key) => (data[key] = value));

        // console.log(data)

        try {
            const response = await fetch('/submit_p2p', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }

            const response_message = await response.json();
            console.log('Success:', response_message);
            spinner.classList.add('hidden');
            setResponseMessage(P2pResponse, P2pResponseContent, response_message['message'], true)

        } catch (error) {
            console.error('Error:', error);
            spinner.classList.add('hidden');
            setResponseMessage(P2pResponse, P2pResponseContent, error, true)
        }
    });
});