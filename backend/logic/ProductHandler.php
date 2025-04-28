<?php
require_once __DIR__ . '/../config/dbaccess.php';

header('Content-Type: application/json');

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $action = $_POST['action'] ?? 'create';

        if ($action === 'create') {
            // Neues Produkt anlegen (mit Bild Upload)
            if (!isset($_POST['name'], $_POST['price'], $_POST['description']) || !isset($_FILES['image'])) {
                http_response_code(400);
                echo json_encode(['message' => '❗ Ungültige Eingabedaten']);
                exit;
            }

            $name = trim($_POST['name']);
            $price = floatval($_POST['price']);
            $description = trim($_POST['description']);
            $image = $_FILES['image'];

            // Bild Upload überprüfen
            if ($image['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['message' => '❌ Fehler beim Hochladen des Bildes.']);
                exit;
            }

            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!in_array(mime_content_type($image['tmp_name']), $allowedTypes)) {
                http_response_code(400);
                echo json_encode(['message' => '❌ Ungültiges Bildformat. Nur JPG, PNG oder GIF erlaubt.']);
                exit;
            }

            $uploadDir = __DIR__ . '/../../uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileName = uniqid('product_') . '.' . pathinfo($image['name'], PATHINFO_EXTENSION);
            $targetPath = $uploadDir . $fileName;
            $relativePath = '/uploads/' . $fileName; // Für die Datenbank

            if (move_uploaded_file($image['tmp_name'], $targetPath)) {
                try {
                    $stmt = $db->prepare("INSERT INTO products (name, price, description, imageUrl) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$name, $price, $description, $relativePath]);

                    http_response_code(201);
                    echo json_encode(['message' => '✅ Produkt erfolgreich gespeichert!']);
                } catch (PDOException $e) {
                    http_response_code(500);
                    echo json_encode(['message' => '❌ Fehler beim Speichern: ' . $e->getMessage()]);
                }
            } else {
                http_response_code(500);
                echo json_encode(['message' => '❌ Fehler beim Speichern des Bildes.']);
            }

        } elseif ($action === 'update') {
            // Produkt aktualisieren
            if (!isset($_POST['id'], $_POST['name'], $_POST['price'], $_POST['description'])) {
                http_response_code(400);
                echo json_encode(['message' => '❗ Ungültige Eingabedaten für Update']);
                exit;
            }

            $id = intval($_POST['id']);
            $name = trim($_POST['name']);
            $price = floatval($_POST['price']);
            $description = trim($_POST['description']);

            try {
                if (!empty($_FILES['image']['name'])) {
                    // Wenn ein neues Bild hochgeladen wird
                    $image = $_FILES['image'];

                    if ($image['error'] !== UPLOAD_ERR_OK) {
                        http_response_code(400);
                        echo json_encode(['message' => '❌ Fehler beim Hochladen des neuen Bildes.']);
                        exit;
                    }

                    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                    if (!in_array(mime_content_type($image['tmp_name']), $allowedTypes)) {
                        http_response_code(400);
                        echo json_encode(['message' => '❌ Ungültiges Bildformat.']);
                        exit;
                    }

                    $uploadDir = __DIR__ . '/../../uploads/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }

                    $fileName = uniqid('product_') . '.' . pathinfo($image['name'], PATHINFO_EXTENSION);
                    $targetPath = $uploadDir . $fileName;
                    $relativePath = '/uploads/' . $fileName;

                    if (move_uploaded_file($image['tmp_name'], $targetPath)) {
                        $stmt = $db->prepare("UPDATE products SET name = ?, price = ?, description = ?, imageUrl = ? WHERE id = ?");
                        $stmt->execute([$name, $price, $description, $relativePath, $id]);
                    } else {
                        http_response_code(500);
                        echo json_encode(['message' => '❌ Fehler beim Speichern des neuen Bildes.']);
                        exit;
                    }
                } else {
                    // Ohne neues Bild
                    $stmt = $db->prepare("UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?");
                    $stmt->execute([$name, $price, $description, $id]);
                }

                http_response_code(200);
                echo json_encode(['message' => '✅ Produkt erfolgreich aktualisiert!']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['message' => '❌ Fehler beim Update: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['message' => '❗ Ungültige Aktion']);
        }
        break;

    case 'GET':
        try {
            $stmt = $db->query("SELECT * FROM products ORDER BY id DESC");
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode($products);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => '❌ Fehler beim Laden der Produkte: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['message' => '❗ Produkt-ID fehlt']);
            exit;
        }

        $id = intval($data['id']);

        try {
            $stmt = $db->prepare("SELECT imageUrl FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($product && isset($product['imageUrl'])) {
                $imagePath = __DIR__ . '/../' . ltrim($product['imageUrl'], '/');
                if (file_exists($imagePath)) {
                    unlink($imagePath);
                }
            }

            $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);

            http_response_code(200);
            echo json_encode(['message' => '✅ Produkt erfolgreich gelöscht!']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => '❌ Fehler beim Löschen: ' . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => '❗ Methode nicht erlaubt']);
        break;
}
?>
