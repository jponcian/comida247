<?php
require_once __DIR__ . '/../config.php';
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->exec("ALTER TABLE orders ADD COLUMN is_paid BOOLEAN DEFAULT FALSE AFTER status");
    echo "Columna is_paid añadida con éxito.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
