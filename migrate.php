<?php
require_once 'config.php';

try {
    // Intentar conectar con 127.0.0.1 que es lo más común para WAMP localmente
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Iniciando migraciones...\n";

    // Función para verificar si una columna existe
    function columnExists($pdo, $table, $column) {
        $stmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
        return $stmt->fetch() !== false;
    }

    // 1. Agregar columnas de precios a la tabla products
    if (!columnExists($pdo, 'products', 'price_medium_usd')) {
        $pdo->exec("ALTER TABLE products ADD COLUMN price_medium_usd DECIMAL(10, 2) DEFAULT NULL AFTER price_usd");
        echo "Columna 'price_medium_usd' añadida a 'products'.\n";
    }

    if (!columnExists($pdo, 'products', 'price_large_usd')) {
        $pdo->exec("ALTER TABLE products ADD COLUMN price_large_usd DECIMAL(10, 2) DEFAULT NULL AFTER price_medium_usd");
        echo "Columna 'price_large_usd' añadida a 'products'.\n";
    }

    // 2. Agregar columna de tamaño a la tabla order_items
    if (!columnExists($pdo, 'order_items', 'size')) {
        $pdo->exec("ALTER TABLE order_items ADD COLUMN size VARCHAR(20) DEFAULT NULL AFTER product_id");
        echo "Columna 'size' añadida a 'order_items'.\n";
    }

    echo "¡Migraciones completadas con éxito!\n";
} catch (PDOException $e) {
    echo "Error durante la migración: " . $e->getMessage() . "\n";
}
