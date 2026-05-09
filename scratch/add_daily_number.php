<?php
require_once __DIR__ . '/../config.php';
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Verificar si la columna ya existe
    $result = $pdo->query("SHOW COLUMNS FROM orders LIKE 'daily_number'");
    if ($result->rowCount() == 0) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN daily_number INT DEFAULT 0 AFTER is_paid");
        echo "Columna 'daily_number' añadida con éxito.\n";
    } else {
        echo "La columna 'daily_number' ya existe.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
