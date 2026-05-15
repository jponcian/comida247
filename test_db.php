<?php
require_once 'config.php';

$ports = [3306, 3307, 3308];
foreach ($ports as $port) {
    echo "Trying port $port...\n";
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=$port;dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
        echo "Success on port $port!\n";
        exit;
    } catch (PDOException $e) {
        echo "Failed on port $port: " . $e->getMessage() . "\n";
    }
}
