document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const res = await fetch('/MarLukTar/backend/logic/UserHandler.php', {
        method: 'POST',
        body: JSON.stringify({
            route: 'register',
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
        window.location.href = 'login.html';
    }
});
