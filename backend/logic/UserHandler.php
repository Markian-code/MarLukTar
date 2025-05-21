<?php
// Benutzerverwaltung: Registrierung, Login, Profilabruf und -aktualisierung

header('Content-Type: application/json');
require_once __DIR__ . '/../config/dbaccess.php';

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $route = $data['route'] ?? '';

    // === 1. PROFIL LADEN ===
    if ($route === 'profile') {
        $userId = intval($data['user_id'] ?? 0);
        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Ungültige Benutzer-ID']);
            exit;
        }

        try {
            $stmt = $db->prepare("SELECT salutation, firstname, lastname, address, zip, city, username AS name, email, payment FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                echo json_encode($user);
            } else {
                http_response_code(404);
                echo json_encode(['message' => 'Benutzer nicht gefunden']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Fehler beim Laden des Profils']);
        }

    // === 2. REGISTRIERUNG ===
    } elseif ($route === 'register') {
        $required = ['salutation', 'firstname', 'lastname', 'address', 'zip', 'city', 'email', 'username', 'password', 'payment'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['message' => "Feld '$field' fehlt."]);
                exit;
            }
        }

        $email = trim($data['email']);
        $username = trim($data['username']);

        $stmt = $db->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
        $stmt->execute([$email, $username]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['message' => 'Benutzername oder E-Mail existiert bereits.']);
            exit;
        }

        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

        try {
            $stmt = $db->prepare("INSERT INTO users (salutation, firstname, lastname, address, zip, city, email, username, password_hash, payment, is_admin, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)");
            $stmt->execute([
                $data['salutation'],
                $data['firstname'],
                $data['lastname'],
                $data['address'],
                $data['zip'],
                $data['city'],
                $data['email'],
                $data['username'],
                $password_hash,
                $data['payment']
            ]);
            http_response_code(201);
            echo json_encode(['message' => '✅ Registrierung erfolgreich!']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => '❌ Fehler bei Registrierung: ' . $e->getMessage()]);
        }

    // === 3. LOGIN ===
    } elseif ($route === 'login') {
    $usernameOrEmail = strtolower(trim($data['username'] ?? ''));
    $password = $data['password'] ?? '';

    if (!$usernameOrEmail || !$password) {
        http_response_code(400);
        echo json_encode(['message' => 'Bitte Benutzername oder E-Mail und Passwort eingeben.']);
        exit;
    }

    try {
        $stmt = $db->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$usernameOrEmail, $usernameOrEmail]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && $user['is_active'] && password_verify($password, $user['password_hash'])) {
            echo json_encode([
                'message' => 'Login erfolgreich!',
                'user_id' => $user['id'],
                'name' => $user['username'],
                'email' => $user['email'],
                'role' => $user['is_admin'] ? 'admin' : 'user'
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['message' => 'Benutzername oder Passwort ist falsch oder Benutzer nicht aktiv.']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Fehler: ' . $e->getMessage()]);
    }

    // === 4. PROFIL AKTUALISIEREN ===
    } elseif ($route === 'update-profile') {
        $userId = intval($data['user_id'] ?? 0);
        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Ungültige Benutzer-ID']);
            exit;
        }

        $updateFields = [
            'salutation' => $data['salutation'] ?? null,
            'firstname' => $data['firstname'] ?? null,
            'lastname' => $data['lastname'] ?? null,
            'address' => $data['address'] ?? null,
            'zip' => $data['zip'] ?? null,
            'city' => $data['city'] ?? null,
            'email' => $data['email'] ?? null,
            'username' => $data['name'] ?? null,
            'payment' => $data['payment'] ?? null
        ];

        $setClause = [];
        $params = [];

        foreach ($updateFields as $field => $value) {
            if (!empty($value)) {
                $setClause[] = "$field = ?";
                $params[] = $value;
            }
        }

        if (!empty($data['password'])) {
            $setClause[] = "password_hash = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        if (empty($setClause)) {
            http_response_code(400);
            echo json_encode(['message' => 'Keine Änderungen angegeben']);
            exit;
        }

        $params[] = $userId;

        try {
            $stmt = $db->prepare("UPDATE users SET " . implode(', ', $setClause) . " WHERE id = ?");
            $stmt->execute($params);
            echo json_encode(['message' => 'Profil erfolgreich aktualisiert!']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Fehler beim Speichern des Profils']);
        }

    } else {
        http_response_code(400);
        echo json_encode(['message' => 'Ungültige Route']);
    }

} elseif ($method === 'GET') {
    $action = $_GET['action'] ?? '';

    // === ADMIN: ALLE KUNDEN LADEN ===
    if ($action === 'all') {
        try {
            $stmt = $db->query("SELECT id, firstname, lastname, email, is_active AS active FROM users WHERE is_admin = 0");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($users);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Fehler beim Laden der Nutzerliste']);
        }
        exit;
    }

    // === ADMIN: STATUS AKTIV/INAKTIV UMSCHALTEN ===
    if ($action === 'toggle' && isset($_GET['id'])) {
        $userId = intval($_GET['id']);
        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Ungültige Benutzer-ID']);
            exit;
        }

        try {
            $stmt = $db->prepare("SELECT is_active FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $current = $stmt->fetchColumn();

            if ($current === false) {
                http_response_code(404);
                echo json_encode(['message' => 'Benutzer nicht gefunden']);
                exit;
            }

            $newStatus = $current ? 0 : 1;
            $update = $db->prepare("UPDATE users SET is_active = ? WHERE id = ?");
            $update->execute([$newStatus, $userId]);

            echo json_encode(['message' => '✅ Status erfolgreich geändert']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => '❌ Fehler beim Umschalten des Status']);
        }

        exit;
    }

    // === UNBEKANNTE GET-ROUTE ===
    http_response_code(400);
    echo json_encode(['message' => 'Ungültige Aktion']);
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Nur GET oder POST erlaubt']);
}
