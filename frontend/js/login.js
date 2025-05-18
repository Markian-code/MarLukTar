console.log("Login.js geladen");

document.addEventListener('DOMContentLoaded', () => {
    // Cookie auslesen und vorbefüllen, falls vorhanden
    const savedUsername = getCookie('rememberedUsername');
    if (savedUsername) {
        document.getElementById('username').value = savedUsername;
        document.getElementById('remember-me').checked = true;
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    // Wenn Checkbox aktiv ist: Cookie setzen, sonst löschen
    if (rememberMe) {
        setCookie('rememberedUsername', username, 30); // 30 Tage gültig
    } else {
        deleteCookie('rememberedUsername');
    }

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

// Cookie-Funktionen
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
    const cookieArr = document.cookie.split(';');
    for (let cookie of cookieArr) {
        const [key, val] = cookie.trim().split('=');
        if (key === name) {
            return decodeURIComponent(val);
        }
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
}
