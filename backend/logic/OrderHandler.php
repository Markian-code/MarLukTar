<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/dbaccess.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();

// Hole rohen Body (für JSON POST)
$data = json_decode(file_get_contents("php://input"), true);

// === STATUS-AKTUALISIERUNG ===
if ($method === 'POST' && isset($data['action']) && $data['action'] === 'updateStatus') {
    $orderId = intval($data['id'] ?? 0);
    $newStatus = $data['status'] ?? '';

    $allowedStatuses = ['offen', 'bezahlt', 'versendet', 'storniert'];
    if (!in_array($newStatus, $allowedStatuses)) {
        http_response_code(400);
        echo json_encode(['message' => 'Ungültiger Status']);
        exit;
    }

    $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $success = $stmt->execute([$newStatus, $orderId]);

    echo json_encode(['message' => $success ? 'Status erfolgreich aktualisiert.' : 'Fehler beim Aktualisieren.']);
    exit;
}

// === BESTELLUNG SPEICHERN (create) ===
elseif ($method === 'POST' && isset($data['action']) && $data['action'] === 'create') {
    $userId        = $data['user_id'] ?? null;
    $cart          = $data['cart'] ?? [];
    $total         = $data['total'] ?? 0;
    $paymentMethod = $data['payment_method'] ?? '';
    $couponCode    = $data['coupon_code'] ?? null;
    $discount      = $data['discount'] ?? 0;
    $finalTotal    = $data['final_total'] ?? $total;

    if (!$userId || empty($cart) || !$paymentMethod) {
        http_response_code(400);
        echo json_encode(['message' => '❌ Ungültige Bestellung – fehlende Felder']);
        exit;
    }

    $allowedMethods = ['Überweisung', 'PayPal', 'Gutschein'];
    if (!in_array($paymentMethod, $allowedMethods)) {
        http_response_code(400);
        echo json_encode(['message' => '❌ Ungültige Zahlungsart']);
        exit;
    }

    try {
        // Hauptbestellung speichern
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

        echo json_encode(['message' => '✅ Bestellung erfolgreich gespeichert.']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => '❌ Fehler beim Speichern: ' . $e->getMessage()]);
    }
    exit;
}

// === BESTELLUNG LÖSCHEN ===
elseif ($method === 'POST' && isset($data['action']) && $data['action'] === 'deleteOrder' && isset($data['id'])) {
    $orderId = intval($data['id']);

    $stmtItems = $db->prepare("DELETE FROM order_items WHERE order_id = ?");
    $stmtItems->execute([$orderId]);

    $stmtOrder = $db->prepare("DELETE FROM orders WHERE id = ?");
    $stmtOrder->execute([$orderId]);

    echo json_encode(['message' => '🗑️ Bestellung erfolgreich gelöscht.']);
    exit;
}

// === BESTELLUNGEN FÜR EINEN USER LADEN ===
elseif ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'listOrdersByUser' && isset($_GET['id'])) {
    $userId = intval($_GET['id']);
    $stmt = $db->prepare("SELECT id, created_at AS date, total, status FROM orders WHERE user_id = ?");
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($orders);
    exit;
}

// === NICHT ERLAUBT ===
http_response_code(405);
echo json_encode(['message' => '❌ Anfrage nicht erlaubt']);
exit;
