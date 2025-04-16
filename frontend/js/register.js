document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    try {
        const res = await fetch('http://localhost/MarLukTar/backend/logic/UserHandler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                route: 'register',
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password')
            })
        });

        const contentType = res.headers.get('Content-Type');

        // Debug: Show raw response if not JSON
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
