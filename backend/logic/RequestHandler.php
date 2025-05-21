<?php
require_once __DIR__ . '/../config/dbaccess.php';
require_once __DIR__ . '/../models/Product.php';

// Eigene Implementierung für ältere PHP-Versionen (< 8.0)
if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) {
        return strpos($haystack, $needle) === 0;
    }
}

header('Content-Type: application/json');
$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';

switch ($route) {
    // Route: Alle Produkte abrufen
    case 'products':
        if ($method === 'GET') {
            $product = new Product($db);
            $stmt = $product->readAll();
            $products = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Kein zusätzlicher "uploads/"-Pfad, wenn bereits enthalten
                if (!empty($row['imageUrl']) && !str_starts_with($row['imageUrl'], 'uploads/')) {
                    $row['imageUrl'] = $row['imageUrl']; // belassen
                } elseif (!empty($row['imageUrl'])) {
                    $row['imageUrl'] = 'uploads/' . ltrim($row['imageUrl'], '/');
                }
                $products[] = $row;
            }

            http_response_code(200);
            echo json_encode($products);
            exit;
        }
        break;

    // Route: Einzelnes Produkt per ID abrufen
    case 'product':
        if ($method === 'GET') {
            $id = intval($_GET['id'] ?? 0);
            if ($id > 0) {
                $product = new Product($db);
                $result = $product->readOne($id);
                if ($result) {
                    if (!empty($result['imageUrl']) && !str_starts_with($result['imageUrl'], 'uploads/')) {
                        $result['imageUrl'] = 'uploads/' . ltrim($result['imageUrl'], '/');
                    }

                    http_response_code(200);
                    echo json_encode($result);
                } else {
                    http_response_code(404);
                    echo json_encode(['message' => 'Produkt nicht gefunden']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['message' => 'Ungültige ID']);
            }
            exit;
        }
        break;

    // Route: Bestellungen eines Benutzers abrufen
    case 'orders':
        if ($method === 'GET') {
            $userId = intval($_GET['user_id'] ?? 0);
            if ($userId <= 0) {
                http_response_code(400);
                echo json_encode(['message' => 'Ungültige Benutzer-ID']);
                exit;
            }

            try {
                $stmt = $db->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC");
                $stmt->execute([$userId]);
                $orders = [];

                while ($order = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $itemStmt = $db->prepare("
                        SELECT oi.product_id, oi.quantity, oi.price, p.name
                        FROM order_items oi
                        JOIN products p ON oi.product_id = p.id
                        WHERE oi.order_id = ?
                    ");
                    $itemStmt->execute([$order['id']]);
                    $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

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

                echo json_encode($orders);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['message' => 'Fehler beim Abrufen der Bestellungen']);
            }
            exit;
        }
        break;

    // Standardroute: Fehler
    default:
        http_response_code(400);
        echo json_encode(['message' => 'Ungültige Route']);
        exit;
}
