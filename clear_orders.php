<?php
require_once 'config.php';
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Desactivar FK checks para limpiar rápido
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("TRUNCATE TABLE order_item_ingredients");
    $pdo->exec("TRUNCATE TABLE order_items");
    $pdo->exec("TRUNCATE TABLE orders");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    echo "Base de datos de órdenes limpiada correctamente.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
