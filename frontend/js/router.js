// router.js – Zugriffsschutz für geschützte Seiten

(function () {
    const userId = localStorage.getItem('userId');

    // Falls keine Benutzer-ID vorhanden, zurück zur Login-Seite
    if (!userId) {
        window.location.href = 'login.html';
    }
})();
