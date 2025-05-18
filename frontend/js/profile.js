// Benutzer-ID aus dem lokalen Speicher abrufen
const userId = localStorage.getItem('userId');
console.log("Profile-Seite UserId:", userId);

// Falls nicht angemeldet, zur Anmeldung umleiten
if (!userId) {
    window.location.href = 'login.html';
}

// 🔄 Profildaten vom Server laden
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
            document.getElementById('profile-message').textContent = '❌ Fehler beim Laden des Profils';
        }
    } catch (error) {
        console.error('Fehler beim Abrufen:', error);
        document.getElementById('profile-message').textContent = '❌ Netzwerkfehler';
    }
}

fetchProfile();

// 🔐 Logout-Funktion
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// 💾 Profildaten speichern (inkl. optionalem Passwort)
document.getElementById('profile-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim(); // optional

    try {
        const res = await fetch('http://localhost/MarLukTar/backend/logic/UserHandler.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                route: 'update-profile',
                user_id: userId,
                name,
                email,
                password // wird nur aktualisiert, wenn nicht leer
            })
        });

        const result = await res.json();

        if (res.ok) {
            document.getElementById('profile-message').textContent = '✅ Profil erfolgreich aktualisiert!';
            document.getElementById('password').value = ''; // Passwortfeld leeren
        } else {
            document.getElementById('profile-message').textContent = result.message || '❌ Fehler beim Speichern.';
        }
    } catch (err) {
        console.error('Fehler:', err);
        document.getElementById('profile-message').textContent = '❌ Netzwerkfehler beim Speichern.';
    }
});
