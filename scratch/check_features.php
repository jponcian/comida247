<?php
require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "--- MESAS ---\n";
    $stmt = $pdo->query("SELECT * FROM tables");
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Total mesas: " . count($tables) . "\n";
    foreach ($tables as $t) {
        echo "- {$t['name']} (Active: {$t['active']})\n";
    }

    echo "\n--- CATEGORIAS ---\n";
    $stmt = $pdo->query("SELECT DISTINCT category FROM products");
    while($r = $stmt->fetch()) {
        echo "- {$r['category']}\n";
    }

    echo "\n--- PRODUCTOS CON TAMAÑOS ---\n";
    $stmt = $pdo->query("SELECT name, category, price_usd, price_medium_usd, price_large_usd FROM products WHERE price_medium_usd IS NOT NULL OR price_large_usd IS NOT NULL");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($products)) {
        echo "No hay productos con precios para diferentes tamaños.\n";
    } else {
        foreach ($products as $p) {
            echo "- [{$p['category']}] {$p['name']}: Base: {$p['price_usd']}, Med: {$p['price_medium_usd']}, Large: {$p['price_large_usd']}\n";
        }
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
