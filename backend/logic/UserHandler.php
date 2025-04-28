<?php
// Benutzerverwaltung: Registrierung, Login, Profilabruf und -aktualisierung

header('Content-Type: application/json');
require_once __DIR__ . '/../config/dbaccess.php';

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// POST-Anfragen: zentral für alle Operationen
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $route = $data['route'] ?? '';

    // 1. PROFIL LADEN
    if ($route === 'profile') {
        $userId = intval($data['user_id'] ?? 0);

        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Ungültige Benutzer-ID']);
            exit;
        }

        try {
            $stmt = $db->prepare("SELECT username AS name, email FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                http_response_code(200);
                echo json_encode($user);
            } else {
                http_response_code(404);
                echo json_encode(['message' => 'Benutzer nicht gefunden']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Fehler beim Laden des Profils']);
        }

    // 2. REGISTRIERUNG
    } elseif ($route === 'register') {
        $username = trim($data['username'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (!$username || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['message' => 'Bitte alle Felder ausfüllen.']);
            exit;
        }

        try {
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $db->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
            $stmt->execute([$username, $email, $password_hash]);

            http_response_code(200);
            echo json_encode(['message' => 'Registrierung erfolgreich!']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Datenbankfehler: ' . $e->getMessage()]);
        }

    // 3. LOGIN
    } elseif ($route === 'login') {
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';

        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['message' => 'Bitte Benutzername und Passwort eingeben.']);
            exit;
        }

        try {
            $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password_hash'])) {
                http_response_code(200);
                echo json_encode([
                    'message' => 'Login erfolgreich!',
                    'user_id' => $user['id'],
                    'name' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['message' => 'Benutzername oder Passwort ist falsch.']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Fehler: ' . $e->getMessage()]);
        }

    // 4. PROFIL AKTUALISIEREN
    } elseif ($route === 'update-profile') {
        $userId = intval($data['user_id'] ?? 0);
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');

        if ($userId <= 0 || !$name || !$email) {
            http_response_code(400);
            echo json_encode(['message' => 'Ungültige Eingabedaten']);
            exit;
        }

        try {
            if ($password) {
                $password_hash = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $db->prepare("UPDATE users SET username = ?, email = ?, password_hash = ? WHERE id = ?");
                $stmt->execute([$name, $email, $password_hash, $userId]);
            } else {
                $stmt = $db->prepare("UPDATE users SET username = ?, email = ? WHERE id = ?");
                $stmt->execute([$name, $email, $userId]);
            }

            http_response_code(200);
            echo json_encode(['message' => 'Profil erfolgreich aktualisiert!']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Fehler beim Speichern des Profils']);
        }

    // UNBEKANNTE ROUTE
    } else {
        http_response_code(400);
        echo json_encode(['message' => 'Ungültige Route']);
    }

} else {
    // NUR POST ERLAUBT
    http_response_code(405);
    echo json_encode(['message' => 'Nur POST erlaubt']);
}
