<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/dbaccess.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $userId = $data['user_id'] ?? null;
    $cart = $data['cart'] ?? [];
    $total = $data['total'] ?? 0;
    $paymentMethod = $data['payment_method'] ?? '';
    $couponCode = $data['coupon_code'] ?? null;
    $discount = $data['discount'] ?? 0;
    $finalTotal = $data['final_total'] ?? $total;

    if (!$userId || empty($cart) || !$paymentMethod) {
        http_response_code(400);
        echo json_encode(['message' => 'Ungültige Bestellung – bitte alle Felder ausfüllen.']);
        exit;
    }

    $allowedMethods = ['Überweisung', 'PayPal', 'Gutschein'];
    if (!in_array($paymentMethod, $allowedMethods)) {
        http_response_code(400);
        echo json_encode(['message' => 'Ungültige Zahlungsart']);
        exit;
    }

    try {
        // Bestellung mit Rabatt speichern
        $stmt = $db->prepare("
            INSERT INTO orders (user_id, total, payment_method, coupon_code, discount, final_total)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $total, $paymentMethod, $couponCode, $discount, $finalTotal]);

        $orderId = $db->lastInsertId();

        // Einzelne Produkte speichern
        $itemStmt = $db->prepare("
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (?, ?, ?, ?)
        ");
        foreach ($cart as $item) {
            $itemStmt->execute([$orderId, $item['id'], $item['quantity'], $item['price']]);
        }

        http_response_code(200);
        echo json_encode(['message' => '✅ Bestellung erfolgreich aufgegeben!']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => '❌ Fehler beim Speichern: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => '❌ Nur POST erlaubt']);
}
