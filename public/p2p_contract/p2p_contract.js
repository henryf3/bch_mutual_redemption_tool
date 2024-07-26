document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('p2p_form').addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent the default form submission


        const imput_nom_units = document.getElementById('nom_units');
        const nom_units = imput_nom_units.value;

        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = '';

        if (nom_units > 100000000 || nom_units < 10) {
            errorMessage.textContent = `Nominal Units must be Higher than 9 and less than 100000001.`;
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