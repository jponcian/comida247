<?php
require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Starting migrations...\n";

    // 1. Agregar columnas de precios a la tabla products
    $pdo->exec("ALTER TABLE products ADD COLUMN price_medium_usd DECIMAL(10, 2) DEFAULT NULL AFTER price_usd");
    $pdo->exec("ALTER TABLE products ADD COLUMN price_large_usd DECIMAL(10, 2) DEFAULT NULL AFTER price_medium_usd");
    echo "Columns added to 'products'.\n";

    // 2. Agregar columna de tamaño a la tabla order_items
    $pdo->exec("ALTER TABLE order_items ADD COLUMN size VARCHAR(20) DEFAULT NULL AFTER product_id");
    echo "Column added to 'order_items'.\n";

    echo "Migrations completed successfully!\n";
} catch (PDOException $e) {
    echo "Error during migrations: " . $e->getMessage() . "\n";
}
