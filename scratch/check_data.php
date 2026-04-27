<?php
require_once 'config.php';
$pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
$stmt = $pdo->query("SELECT * FROM businesses");
header('Content-Type: text/plain');
foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    print_r($row);
}
