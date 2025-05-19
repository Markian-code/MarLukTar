<?php
require_once __DIR__ . '/../config/dbaccess.php';
require_once __DIR__ . '/../models/Product.php';

$db = getDBConnection();

$method = $_SERVER['REQUEST_METHOD'];
$route = isset($_GET['route']) ? $_GET['route'] : '';

switch ($route) {
    case 'products':
        if ($method === 'GET') {
            $product = new Product($db);
            $stmt = $product->readAll();
            $products = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $products[] = $row;
            }

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode($products);
        }
        break;

    case 'orders':
        if ($method === 'GET') {
            $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
            if ($userId <= 0) {
                http_response_code(400);
                echo json_encode(['message' => 'Ungültige Benutzer-ID']);
                exit;
            }

            try {
                // Alle Bestellungen des Benutzers
                $stmt = $db->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC");
                $stmt->execute([$userId]);
                $orders = [];

                while ($order = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    // Hole die zugehörigen Produkte
                    $itemStmt = $db->prepare("
                        SELECT oi.product_id, oi.quantity, oi.price, p.name
                        FROM order_items oi
                        JOIN products p ON oi.product_id = p.id
                        WHERE oi.order_id = ?
                    ");
                    $itemStmt->execute([$order['id']]);
                    $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

                    // Sichere Konvertierung von Rabatt (discount) und final_total
                    $orders[] = [
                        'order_id'       => $order['id'],
                        'user_id'        => $order['user_id'],
                        'total'          => (float)$order['total'],
                        'payment_method' => $order['payment_method'] ?? 'Keine Angabe',
                        'coupon_code'    => $order['coupon_code'] ?? '',
                        'discount'       => isset($order['discount']) ? (float)$order['discount'] : 0,
                        'final_total'    => isset($order['final_total']) ? (float)$order['final_total'] : (float)$order['total'],
                        'date'           => $order['created_at'] ?? 'Unbekannt',
                        'items'          => $items
                    ];
                }

                header('Content-Type: application/json');
                echo json_encode($orders);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['message' => 'Fehler beim Abrufen der Bestellungen']);
            }
        }
        break;

    case 'product':
        if ($method === 'GET') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($id > 0) {
                $product = new Product($db);
                $result = $product->readOne($id);
                if ($result) {
                    http_response_code(200);
                    header('Content-Type: application/json');
                    echo json_encode($result);
                } else {
                    http_response_code(404);
                    echo json_encode(["message" => "Product not found"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["message" => "Invalid ID"]);
            }
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["message" => "Invalid route"]);
        break;
}
