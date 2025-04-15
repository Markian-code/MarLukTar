<?php
require_once __DIR__ . '/../config/dbaccess.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $route = $data['route'] ?? '';

    if ($route === 'register') {
        $username = $data['username'] ?? '';
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (!$username || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['message' => 'Bitte alle Felder ausfüllen.']);
            exit;
        }

        $password_hash = password_hash($password, PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
        $stmt = $db->prepare($sql);

        try {
            $stmt->execute([$username, $email, $password_hash]);
            http_response_code(200);
            echo json_encode(['message' => '✅ Registrierung erfolgreich!']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => '❌ Fehler: ' . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['message' => 'Ungültige Route']);
    }
}
