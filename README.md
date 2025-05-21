# 🛍️ MarLukTar Webshop

Ein moderner Webshop mit Benutzerregistrierung, Login, Adminbereich, Produktverwaltung, Warenkorb, Gutscheinsystem und Bestellprozess. Entwickelt im Rahmen eines FH-Technikum Wien Projekts (Sommersemester 2025).

## Funktionen

### Benutzerfunktionen
- Registrierung mit Pflichtfeldern (inkl. Anrede, Adresse, Zahlungsmethode)
- Login mit **Benutzernamen oder E-Mail-Adresse**
- Login merken (Cookie-basiert)
- Persönlicher Bereich („Mein Profil“)
- Produkte in Warenkorb legen und Bestellung ausführen

### Warenkorb & Checkout
- Drag & Drop Produkt in den Warenkorb
- Gesamtpreis & Rabattberechnung
- Auswahl der Zahlungsart
- Eingabe von Gutscheincodes mit dynamischer Rabattlogik
- Bestellung wird gespeichert

### Adminbereich
- Produktverwaltung (Hinzufügen, Bearbeiten, Löschen, Sortierung)
- Kundenübersicht (aktiv/inaktiv)
- Bestellungen pro Kunde einsehbar
- Gutscheine verwalten

## Verwendete Technologien

- **Frontend**: HTML, CSS/SCSS, JavaScript (Vanilla), Bootstrap
- **Backend**: PHP 8.x (PDO), JSON API
- **Datenbank**: MySQL / MariaDB (XAMPP)
- **Tools**: Sass, VS Code, Git

## Sicherheit

- Passwort-Hashing mit `password_hash()`
- Validierung von Eingabefeldern
- Bild-Upload mit MIME-Type-Check
- Zugriffsschutz für Adminfunktionen

## Projektstruktur

MarLukTar/
├── backend/
│ ├── config/
│ ├── logic/
│ ├── models/
├── frontend/
│ ├── css/
│ ├── js/
│ ├── scss/
│ ├── images/
├── uploads/
└── README.md

## Projekt starten

1. Projekt in XAMPP `htdocs`-Ordner kopieren
2. Datenbank aus `db/ajax.sql` importieren
3. `http://localhost/MarLukTar/frontend/index.html` im Browser öffnen

## Autor

Markiian Kovalko 
Tareq El Khadra 
Lukas Zhou 
FH Technikum Wien  
Studiengang Wirtschaftsinformatik (4. Semester)