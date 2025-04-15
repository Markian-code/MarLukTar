document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch('../backend/logic/UserHandler.php?route=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    const msg = document.getElementById('login-message');

    if (res.ok) {
        msg.style.color = 'green';
        msg.textContent = '✅ Login erfolgreich!';
        // Можна зберегти сесію, токен або перейти до профілю
    } else {
        msg.style.color = 'red';
        msg.textContent = data.message || '❌ Fehler beim Login.';
    }
});
