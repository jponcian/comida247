<?php
require_once 'config.php';
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("ALTER TABLE orders MODIFY COLUMN status ENUM('pendiente', 'preparando', 'listo', 'despachado', 'cobrado') DEFAULT 'pendiente'");
    echo "Status enum actualizado.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
