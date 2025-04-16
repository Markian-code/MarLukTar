<?php
function getDBConnection() {
    $host = '127.0.0.1';
    $dbname = 'ajax';
    $username = 'root';
    $password = '';

    try {
        return new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    } catch (PDOException $e) {
        die("Connection failed: " . $e->getMessage());
    }
}
$db = getDBConnection();

?>

