<?php
require_once __DIR__ . '/../config/dbaccess.php';

header('Content-Type: application/json');

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Erst prüfen, ob JSON-Request mit action "updateOrder" kommt
if ($method === 'POST' && empty($_POST) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['action']) && $input['action'] === 'updateOrder' && isset($input['order'])) {
        foreach ($input['order'] as $item) {
            $id = intval($item['id']);
            $position = intval($item['position']);

            $stmt = $db->prepare("UPDATE products SET sort_order = ? WHERE id = ?");
            $stmt->execute([$position, $id]);
        }

        echo json_encode(['message' => '✅ Produktreihenfolge erfolgreich aktualisiert.']);
        exit;
    }
}

// Jetzt reguläres Switch
switch ($method) {
    case 'POST':
        $action = $_POST['action'] ?? 'create';

        if ($action === 'create') {
            // Produkt anlegen...
        } elseif ($action === 'update') {
            // Produkt aktualisieren...
        } else {
            http_response_code(400);
            echo json_encode(['message' => '❗ Ungültige Aktion']);
        }
        break;

    case 'GET':
        try {
            $stmt = $db->query("SELECT * FROM products ORDER BY sort_order ASC, id DESC");
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode($products);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => '❌ Fehler beim Laden der Produkte: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Produkt löschen...
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => '❗ Methode nicht erlaubt']);
        break;
}
?>
