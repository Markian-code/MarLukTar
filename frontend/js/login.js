document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch('../backend/logic/UserHandler.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            route: 'login',
            username,
            password
        })
    });

    const data = await res.json();
    const msg = document.getElementById('login-message');

    if (res.ok) {
        // Einheitliche Benutzerdaten speichern (camelCase)
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userEmail', data.email);

        // ➤ Weiterleitung zur Profilseite
        window.location.href = 'profile.html';
    } else {
        msg.style.color = 'red';
        msg.textContent = data.message || 'Fehler beim Login.';
    }
});
