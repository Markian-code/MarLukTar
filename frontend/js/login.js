console.log("Login.js geladen");

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
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userRole', data.role);

        // Speichere Login-Cookie, wenn Checkbox aktiviert ist
        if (document.getElementById('rememberMe').checked) {
            document.cookie = `remember=${data.user_id}; max-age=604800; path=/`;
        }

        const userRole = localStorage.getItem('userRole');
        console.log("Angemeldete Rolle:", userRole);

        if (userRole === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'profile.html';
        }
    } else {
        msg.textContent = "❌ Login fehlgeschlagen.";
    }
});
