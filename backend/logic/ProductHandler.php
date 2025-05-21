<?php
require_once __DIR__ . '/../config/dbaccess.php';
require_once __DIR__ . '/../models/Product.php';

header('Content-Type: application/json');

$db = getDBConnection();
$product = new Product($db);
$method = $_SERVER['REQUEST_METHOD'];

// POST-Anfrage (Produkt erstellen / aktualisieren / Reihenfolge)
if ($method === 'POST') {
    // Reihenfolge separat behandeln (JSON, nicht FormData)
    if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $input = json_decode(file_get_contents("php://input"), true);

        if (isset($input['action']) && $input['action'] === 'updateOrder') {
            $order = $input['order'] ?? [];
            $success = $product->updateOrder($order);
            echo json_encode([
                'message' => $success
                    ? '✅ Reihenfolge gespeichert.'
                    : '❌ Fehler beim Speichern der Reihenfolge.'
            ]);
            exit;
        }
    }

    // Formulardaten (FormData)
    if (isset($_POST['action'])) {
        $action = $_POST['action'];
        $name = $_POST['name'] ?? '';
        $price = $_POST['price'] ?? '';
        $description = $_POST['description'] ?? '';
        $id = $_POST['id'] ?? null;

        // 🔽 Bild hochladen
        $imagePath = '';
        if (!empty($_FILES['image']['name'])) {
            $uploadDir = realpath(__DIR__ . '/../../uploads') . DIRECTORY_SEPARATOR;
            $fileName = 'product_' . uniqid() . '_' . basename($_FILES['image']['name']);
            $targetPath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                $imagePath = 'uploads/' . $fileName; // Webpfad
            } else {
                error_log('❌ Fehler beim move_uploaded_file: ' . print_r($_FILES['image'], true));
                http_response_code(500);
                echo json_encode(['message' => '❌ Fehler beim Hochladen des Bildes.']);
                exit;
            }
        }

        // 🟢 Produkt erstellen
        if ($action === 'create') {
            $success = $product->create($name, $price, $description, $imagePath);

            if (!$success) {
                error_log("❌ Fehler beim Erstellen des Produkts (create fehlgeschlagen)");
            }

            echo json_encode([
                'message' => $success
                    ? '✅ Produkt erfolgreich erstellt.'
                    : '❌ Fehler beim Erstellen des Produkts.'
            ]);
            exit;
        }

        // 🟡 Produkt aktualisieren
        if ($action === 'update' && $id !== null) {
            if ($imagePath === '' && method_exists($product, 'getById')) {
                $existing = $product->getById($id);
                if ($existing && isset($existing['imageUrl'])) {
                    $imagePath = $existing['imageUrl'];
                }
            }

            $success = $product->update($id, $name, $price, $description, $imagePath);

            if (!$success) {
                error_log("❌ Fehler beim Aktualisieren des Produkts (update fehlgeschlagen)");
            }

            echo json_encode([
                'message' => $success
                    ? '✅ Produkt erfolgreich aktualisiert.'
                    : '❌ Fehler beim Aktualisieren des Produkts.'
            ]);
            exit;
        }
    }

    echo json_encode(['message' => '❌ Ungültige POST-Daten.']);
    exit;
}

// DELETE-Anfrage
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents("php://input"), true);
    $id = $input['id'] ?? null;

    if ($id) {
        $success = $product->delete($id);
        echo json_encode(['message' => $success
            ? '✅ Produkt erfolgreich gelöscht.'
            : '❌ Fehler beim Löschen des Produkts.']);
    } else {
        echo json_encode(['message' => '❌ Produkt-ID fehlt.']);
    }
    exit;
}

// GET-Anfrage (alle Produkte abrufen)
if ($method === 'GET') {
    $stmt = $product->readAll();
    $products = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $products[] = $row;
    }

    echo json_encode($products);
    exit;
}

// ❌ Methode nicht erlaubt
http_response_code(405);
echo json_encode(['message' => '❌ Nicht unterstützte Methode.']);
exit;
