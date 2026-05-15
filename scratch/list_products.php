<?php
require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "--- TODOS LOS PRODUCTOS ---\n";
    $stmt = $pdo->query("SELECT id, business_id, name, category, price_usd, price_medium_usd, price_large_usd FROM products");
    while($p = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "[ID: {$p['id']}, Bus: {$p['business_id']}] {$p['name']} ({$p['category']}) - \${$p['price_usd']}\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
