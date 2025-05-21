console.log("✅ JavaScript geladen");

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const password = formData.get('password');
    const repeatPassword = formData.get('repeat_password');

    // Passwörter vergleichen
    if (password !== repeatPassword) {
        alert('❌ Die Passwörter stimmen nicht überein!');
        return;
    }

    try {
        const res = await fetch('http://localhost/MarLukTar/backend/logic/UserHandler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                route: 'register',
                salutation: formData.get('salutation'),
                firstname: formData.get('firstname'), 
                lastname: formData.get('lastname'),
                address: formData.get('address'),
                zip: formData.get('zip'),
                city: formData.get('city'),
                email: formData.get('email'),
                username: formData.get('username'),
                password: formData.get('password'),
                payment: formData.get('payment')
            })
        });

        const contentType = res.headers.get('Content-Type');

        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('❌ Response is not JSON:', text);
            alert('Serverfehler: Die Antwort ist kein gültiges JSON.\n' + text);
            return;
        }

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
            window.location.href = 'login.html';
        }

    } catch (error) {
        console.error('❌ Fehler beim Registrieren:', error);
        alert('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
    }
});
