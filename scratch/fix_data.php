<?php
require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Obtener el primer business_id
    $stmt = $pdo->query("SELECT id FROM businesses LIMIT 1");
    $business_id = $stmt->fetchColumn();

    if (!$business_id) {
        die("No hay negocios.\n");
    }

    echo "Usando Business ID: $business_id\n";

    // 1. Añadir mesas si faltan
    $mesas = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Terraza 1', 'Terraza 2'];
    foreach ($mesas as $m) {
        $stmt = $pdo->prepare("SELECT id FROM tables WHERE name = ? AND business_id = ?");
        $stmt->execute([$m, $business_id]);
        if (!$stmt->fetch()) {
            $pdo->prepare("INSERT INTO tables (business_id, name, active) VALUES (?, ?, 1)")->execute([$business_id, $m]);
            echo "Mesa '$m' añadida.\n";
        }
    }

    // 2. Corregir categorías vacías
    $pdo->prepare("UPDATE products SET category = 'Shawarmas' WHERE name = 'Shawarma Premium' AND business_id = ?")->execute([$business_id]);
    $pdo->prepare("UPDATE products SET category = 'Pepitos' WHERE name = 'Pepito Mixto' AND business_id = ?")->execute([$business_id]);
    $pdo->prepare("UPDATE products SET category = 'Pepitos' WHERE name = 'Metro Pepito' AND business_id = ?")->execute([$business_id]);
    $pdo->prepare("UPDATE products SET category = 'Pizzas' WHERE name = 'Pizza Pepperoni' AND business_id = ?")->execute([$business_id]);
    echo "Categorías corregidas.\n";

    // 3. Añadir tamaños a las Pizzas
    $stmt = $pdo->prepare("UPDATE products SET price_medium_usd = 12.00, price_large_usd = 15.00 WHERE category = 'Pizzas' AND business_id = ?");
    $stmt->execute([$business_id]);
    echo "Pizzas actualizadas con tamaños (Med: $12, Large: $15).\n";

    // 4. Añadir tamaños a los Pepitos
    $stmt = $pdo->prepare("UPDATE products SET price_medium_usd = 10.00, price_large_usd = 14.00 WHERE category = 'Pepitos' AND business_id = ?");
    $stmt->execute([$business_id]);
    echo "Pepitos actualizados con tamaños (Med: $10, Large: $14).\n";

    echo "\n¡Datos actualizados con éxito!\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
