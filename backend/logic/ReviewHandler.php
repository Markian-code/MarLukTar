<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/dbaccess.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Erwartet: ?product_id=123
    $productId = isset($_GET['product_id']) ? intval($_GET['product_id']) : 0;
    if (!$productId) {
        http_response_code(400);
        echo json_encode(['message' => 'Ungültige Produkt-ID']);
        exit;
    }

    try {
        $stmt = $db->prepare("
            SELECT r.rating, r.comment, r.created_at, u.username
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$productId]);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($reviews);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Fehler beim Laden der Reviews', 'error' => $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    // JSON-Body: { product_id, user_id, rating, comment }
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = intval($data['product_id'] ?? 0);
    $userId    = intval($data['user_id']    ?? 0);
    $rating    = intval($data['rating']     ?? 0);
    $comment   = trim($data['comment']      ?? '');

    if (!$productId || !$userId || $rating < 1 || $rating > 5 || $comment === '') {
        http_response_code(400);
        echo json_encode(['message' => 'Bitte alle Felder korrekt ausfüllen']);
        exit;
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$productId, $userId, $rating, $comment]);
        echo json_encode(['message' => 'Review erfolgreich gespeichert']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Fehler beim Speichern des Reviews', 'error' => $e->getMessage()]);
    }
    exit;
}

// Alle anderen Methoden nicht erlaubt
http_response_code(405);
echo json_encode(['message' => 'Methode nicht erlaubt']);
