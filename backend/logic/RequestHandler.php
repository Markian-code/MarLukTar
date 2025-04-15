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
?>
