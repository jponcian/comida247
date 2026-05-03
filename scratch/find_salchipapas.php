<?php
require_once 'config.php';
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->prepare("SELECT id FROM products WHERE name = ?");
    $stmt->execute(['Salchipapas']);
    $id = $stmt->fetchColumn();
    echo "ID: " . $id;
} catch (Exception $e) {
    echo $e->getMessage();
}
