// Benutzer-ID aus dem lokalen Speicher abrufen
const userId = localStorage.getItem('user_id');

// Falls nicht angemeldet, zur Anmeldung umleiten
if (!userId) {
    window.location.href = 'login.html';
}

// Profildaten laden
async function fetchProfile() {
    try {
        const res = await fetch('http://localhost/MarLukTar/backend/logic/UserHandler.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                route: 'profile',
                user_id: userId
            })
        });

        const data = await res.json();

        if (res.ok) {
            document.getElementById('name').value = data.name;
            document.getElementById('email').value = data.email;
        } else {
            document.getElementById('profile-message').textContent = 'Fehler beim Laden des Profils';
        }
    } catch (error) {
        console.error('Fehler beim Abrufen:', error);
        document.getElementById('profile-message').textContent = 'Netzwerkfehler';
    }
}

fetchProfile();

// Abmelden
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
