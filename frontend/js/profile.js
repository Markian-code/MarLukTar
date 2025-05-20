// Benutzer-ID aus dem lokalen Speicher abrufen
const userId = localStorage.getItem('userId');
console.log("Profile-Seite UserId:", userId);

// Falls nicht angemeldet, zur Anmeldung umleiten
if (!userId) {
    window.location.href = 'login.html';
}

// Profildaten vom Server laden
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
            // Felder setzen
            document.getElementById('salutation').value = data.salutation || '';
            document.getElementById('firstname').value = data.firstname || '';
            document.getElementById('lastname').value = data.lastname || '';
            document.getElementById('address').value = data.address || '';
            document.getElementById('zip').value = data.zip || '';
            document.getElementById('city').value = data.city || '';
            document.getElementById('name').value = data.name || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('payment').value = data.payment || '';
        } else {
            document.getElementById('profile-message').textContent = '❌ Fehler beim Laden des Profils';
        }
    } catch (error) {
        console.error('Fehler beim Abrufen:', error);
        document.getElementById('profile-message').textContent = '❌ Netzwerkfehler';
    }
}

fetchProfile();

// Logout-Funktion
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Profildaten speichern (inkl. optionalem Passwort)
document.getElementById('profile-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Alle neuen Felder erfassen
    const salutation = document.getElementById('salutation').value.trim();
    const firstname = document.getElementById('firstname').value.trim();
    const lastname = document.getElementById('lastname').value.trim();
    const address = document.getElementById('address').value.trim();
    const zip = document.getElementById('zip').value.trim();
    const city = document.getElementById('city').value.trim();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const payment = document.getElementById('payment').value.trim();
    const password = document.getElementById('password').value.trim(); // optional

    try {
        const res = await fetch('http://localhost/MarLukTar/backend/logic/UserHandler.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                route: 'update-profile',
                user_id: userId,
                salutation,
                firstname,
                lastname,
                address,
                zip,
                city,
                name,
                email,
                payment,
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
