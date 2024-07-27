document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('p2p_form').addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent the default form submission


        const imput_nom_units = document.getElementById('nom_units');
        const nom_units = imput_nom_units.value;

        const imput_cont_dur_insec = document.getElementById('cont_dur_insec');
        const cont_dur_insec = imput_cont_dur_insec.value;

        const imput_low_liq_multi = document.getElementById('low_liq_multi');
        const low_liq_multi = imput_low_liq_multi.value;

        const imput_hig_liq_mult = document.getElementById('hig_liq_mult');
        const hig_liq_mult = imput_hig_liq_mult.value;

        const imput_p1_short_key = document.getElementById('p1_short_key');
        const p1_short_key = imput_p1_short_key.value;

        const imput_p2_long_key = document.getElementById('p2_long_key');
        const p2_long_key = imput_p2_long_key.value;

        const imput_auth_token = document.getElementById('auth_token');
        const auth_token = imput_auth_token.value;
        
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = '';

        //Validate max and min units
        if (nom_units > 100000000 || nom_units < 10) {
            errorMessage.textContent = `Nominal Units must be Higher than 9 and less than 100000001.`;
            return;
        }

        //Validate CONTRACT_DURATION_IN_SECONDS
        if(cont_dur_insec < 3600){
            errorMessage.textContent = `The duration of the contract must be greater than 3600`;
            return;
        }

        //Validation LOW_LIQUIDATION_MULTIPLIER
        if(low_liq_multi <0.7){
            errorMessage.textContent = `The min low liquidation must be 0.75`;
            return;
        }

        //Validation HIGH_LIQUIDATION_MULTIPLIER
        if(hig_liq_mult < 1.25){
            errorMessage.textContent = `The high low liquidation must be 1.25`;
            return;
        }

        //Validation PEER1_SHORT_P_KEY
        if(p1_short_key.length > 52){
            errorMessage.textContent = `just 52 Characters`;
            p1_short_key.value = p1_short_key(0,52)
            return;
        }

        //Validation PEER2_SHORT_P_KEY
        if(p2_long_key.length > 52){
            errorMessage.textContent = `just 52 Characters`;
            p2_long_key.value = p2_long_key(0,52)
            return;
        }

        //Validation AUTH_TOKEN
        if(p2_long_key.length > 64){
            errorMessage.textContent = `just 64 Characters`;
            auth_token.value = auth_token(0,64)
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

            const result = await response.json();
            console.log('Success:', result);
        } catch (error) {
            console.error('Error:', error);
        }
    });
});