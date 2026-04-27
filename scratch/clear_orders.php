<?php
$host = 'localhost';
$db   = 'comida247';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     
     // Desactivar claves foráneas temporalmente para truncar
     $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
     $pdo->exec("TRUNCATE TABLE order_item_ingredients");
     $pdo->exec("TRUNCATE TABLE order_items");
     $pdo->exec("TRUNCATE TABLE orders");
     $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

     echo "Órdenes limpiadas con éxito";

} catch (\PDOException $e) {
     echo "Error: " . $e->getMessage();
}
