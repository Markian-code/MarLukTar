<?php
require_once __DIR__ . '/../config/dbaccess.php';

class Product {
    private $conn;
    private $table = 'products';

    public function __construct($db) {
        $this->conn = $db;
    }

    // 🔍 Alle Produkte lesen
    public function readAll() {
        $query = "SELECT * FROM {$this->table} ORDER BY sort_order ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // 🔍 Ein Produkt nach ID lesen
    public function readOne($id) {
        $query = "SELECT * FROM {$this->table} WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ✅ Produkt erstellen (mit getrenntem Sortierungsschritt)
    public function create($name, $price, $description, $imageUrl) {
        try {
            // Schritt 1: Aktuellen Maximalwert der Sortierung holen
            $orderStmt = $this->conn->query("SELECT IFNULL(MAX(sort_order), 0) + 1 AS next_sort_order FROM {$this->table}");
            $sortOrder = $orderStmt->fetch(PDO::FETCH_ASSOC)['next_sort_order'] ?? 1;

            // Schritt 2: Produkt einfügen
            $query = "INSERT INTO {$this->table} (name, price, description, imageUrl, sort_order)
                      VALUES (:name, :price, :description, :imageUrl, :sort_order)";
            $stmt = $this->conn->prepare($query);
            return $stmt->execute([
                ':name' => $name,
                ':price' => $price,
                ':description' => $description,
                ':imageUrl' => $imageUrl,
                ':sort_order' => $sortOrder
            ]);
        } catch (PDOException $e) {
            error_log("❌ Fehler beim Einfügen des Produkts: " . $e->getMessage());
            return false;
        }
    }

    // ✏️ Produkt aktualisieren
    public function update($id, $name, $price, $description, $imageUrl) {
        $query = "UPDATE {$this->table}
                  SET name = :name, price = :price, description = :description, imageUrl = :imageUrl
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([
            ':name' => $name,
            ':price' => $price,
            ':description' => $description,
            ':imageUrl' => $imageUrl,
            ':id' => $id
        ]);
    }

    // ❌ Produkt löschen
    public function delete($id) {
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    // 🔁 Reihenfolge aktualisieren
    public function updateOrder($orderArray) {
        $this->conn->beginTransaction();
        try {
            $query = "UPDATE {$this->table} SET sort_order = :position WHERE id = :id";
            $stmt = $this->conn->prepare($query);

            foreach ($orderArray as $item) {
                $stmt->execute([
                    ':id' => $item['id'],
                    ':position' => $item['position']
                ]);
            }

            $this->conn->commit();
            return true;
        } catch (PDOException $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    // 🔍 Produkt nach ID laden (z. B. für Update)
    public function getById($id) {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
