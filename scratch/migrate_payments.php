<?php
require_once __DIR__ . '/../config.php';
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->exec("CREATE TABLE IF NOT EXISTS order_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        amount_original DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        method VARCHAR(50) NOT NULL,
        amount_usd DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )");
    echo "Tabla order_payments creada con éxito.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
