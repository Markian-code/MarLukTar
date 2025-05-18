// router.js – Zugriffsschutz für geschützte Seiten

(function () {
    let userId = localStorage.getItem('userId');

    // Wenn kein localStorage vorhanden ist, prüfe das Cookie
    if (!userId) {
        const cookies = document.cookie.split(';').map(c => c.trim());
        const remember = cookies.find(c => c.startsWith('remember='));

        if (remember) {
            userId = remember.split('=')[1];
            // Optional: speichere auch im localStorage
            localStorage.setItem('userId', userId);
        }
    }

    // Wenn immer noch keine Benutzer-ID → zurück zur Login-Seite
    if (!userId) {
        window.location.href = 'login.html';
    }
})();
