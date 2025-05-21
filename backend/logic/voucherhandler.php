<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/dbaccess.php';

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];

    //  Alle Gutscheine anzeigen
    if ($action === 'list') {
        $stmt = $db->query("SELECT code, discount, expiry_date FROM coupons ORDER BY created_at DESC");
        $coupons = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($coupons);
        exit;
    }

    //  Einzelnen Gutschein prüfen
    if ($action === 'check' && isset($_GET['code'])) {
        $code = trim($_GET['code']);

        $stmt = $db->prepare("SELECT * FROM coupons WHERE code = ? AND is_used = 0 AND expiry_date >= CURDATE()");
        $stmt->execute([$code]);
        $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($coupon) {
            echo json_encode($coupon);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Gutschein nicht gefunden oder abgelaufen.']);
        }
        exit;
    }
}

//  Neuen Gutschein erstellen
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $code = strtoupper(trim($data['code'] ?? ''));
    $discount = floatval($data['value'] ?? 0);
    $expiry = $data['expiry'] ?? null;

    if (!$code || !$discount || !$expiry) {
        http_response_code(400);
        echo json_encode(['message' => 'Fehlende Felder']);
        exit;
    }

    try {
        $stmt = $db->prepare("INSERT INTO coupons (code, discount, expiry_date, is_used, created_at) VALUES (?, ?, ?, 0, NOW())");
        $stmt->execute([$code, $discount, $expiry]);

        http_response_code(201);
        echo json_encode(['message' => '✅ Gutschein erfolgreich gespeichert!']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => '❌ Fehler beim Speichern', 'details' => $e->getMessage()]);
    }
}
