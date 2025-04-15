<?php
require_once '../config/dbaccess.php';

header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $action = $_GET['action'] ?? '';

    if ($action === 'register') {
        register($data);
    } elseif ($action === 'login') {
        login($data);
    } else {
        echo json_encode(['error' => 'Ungültige Aktion']);
    }
}

function register($data) {
    global $pdo;
    $username = $data['username'];
    $email = $data['email'];
    $password = password_hash($data['password'], PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
    if ($stmt->execute([$username, $email, $password])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Registrierung fehlgeschlagen.']);
    }
}

function login($data) {
    global $pdo;
    $email = $data['email'];
    $password = $data['password'];

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        echo json_encode(['success' => true, 'username' => $user['username'], 'user_id' => $user['id']]);
    } else {
        echo json_encode(['error' => 'Login fehlgeschlagen.']);
    }
}
