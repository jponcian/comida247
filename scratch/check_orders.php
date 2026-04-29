<?php
require_once 'config.php';
try {
    $pdo = new PDO("mysql:host=localhost;dbname=comida247;charset=utf8", "root", "");
    $stmt = $pdo->query("SELECT DATE(created_at) as fecha, status, COUNT(*) as count FROM orders GROUP BY DATE(created_at), status ORDER BY fecha DESC LIMIT 10");
    echo "Últimas órdenes en el sistema:\n";
    foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        echo "- {$row['fecha']} [{$row['status']}]: {$row['count']}\n";
    }
} catch (Exception $e) { echo "Error: " . $e->getMessage(); }
