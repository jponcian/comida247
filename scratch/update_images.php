<?php
require_once 'config.php';
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $updates = [
        ['id' => 13, 'image' => 'uploads/sandwich_especial_v2.png'],
        ['id' => 14, 'image' => 'uploads/papas_fritas_v2.png'],
    ];

    $stmt = $pdo->prepare("UPDATE products SET image_url = ? WHERE id = ?");

    foreach ($updates as $u) {
        $stmt->execute([$u['image'], $u['id']]);
        echo "Actualizado producto ID {$u['id']} con imagen {$u['image']}\n";
    }

} catch (Exception $e) {
    echo $e->getMessage();
}
