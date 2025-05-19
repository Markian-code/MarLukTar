<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/dbaccess.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $code = trim($data['code'] ?? '');

    if (!$code) {
        http_response_code(400);
        echo json_encode(['message' => 'Kein Gutscheincode übergeben.']);
        exit;
    }

    try {
        $stmt = $db->prepare("SELECT * FROM coupons WHERE code = ?");
        $stmt->execute([$code]);
        $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$coupon) {
            http_response_code(404);
            echo json_encode(['message' => 'Gutschein nicht gefunden.']);
            exit;
        }

        if ($coupon['is_used']) {
            http_response_code(403);
            echo json_encode(['message' => 'Gutschein wurde bereits verwendet.']);
            exit;
        }

        // gültiger Gutschein
        http_response_code(200);
        echo json_encode(['message' => 'Gutschein gültig!', 'discount' => $coupon['discount']]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Fehler: ' . $e->getMessage()]);
    }

} else {
    http_response_code(405);
    echo json_encode(['message' => 'Nur POST erlaubt.']);
}
