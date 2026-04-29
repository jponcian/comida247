<?php
require_once 'config.php';

$products = [
    [
        'name' => 'Burger Clásica',
        'description' => 'Carne 150g, queso cheddar, lechuga y tomate.',
        'price_usd' => 5.99,
        'category' => 'Hamburguesas',
        'image_url' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80'
    ],
    [
        'name' => 'Perro Especial',
        'description' => 'Salchicha, queso rallado, tocino y salsas.',
        'price_usd' => 4.00,
        'category' => 'Perros Calientes',
        'image_url' => 'https://images.unsplash.com/photo-1541214113241-21578d2d9b62?auto=format&fit=crop&w=500&q=80'
    ],
    [
        'name' => 'Shawarma Premium',
        'description' => 'Carne de primera, vegetales frescos y salsa de la casa.',
        'price_usd' => 6.50,
        'category' => 'Shawarmas',
        'image_url' => 'uploads/shawarma_premium_1777311973029.png'
    ],
    [
        'name' => 'Pepito Mixto',
        'description' => 'Carne y pollo salteado, papitas, queso y explosión de salsas.',
        'price_usd' => 8.00,
        'category' => 'Pepitos',
        'image_url' => 'uploads/pepito_mixto_1777311988190.png'
    ],
    [
        'name' => 'Metro Pepito',
        'description' => 'El gigante de la casa. Ideal para compartir entre 4.',
        'price_usd' => 15.00,
        'category' => 'Pepitos',
        'image_url' => 'uploads/metro_pepito_1777312005099.png'
    ],
    [
        'name' => 'Pizza Pepperoni',
        'description' => 'Masa artesanal, mozzarella y el mejor pepperoni.',
        'price_usd' => 10.00,
        'category' => 'Pizzas',
        'image_url' => 'uploads/pizza_pepperoni_1777312023157.png'
    ]
];

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Obtener el primer business_id disponible si no se especifica
    $stmt = $pdo->query("SELECT id FROM businesses LIMIT 1");
    $business_id = $stmt->fetchColumn();

    if (!$business_id) {
        die("Error: No hay negocios creados en el servidor.\n");
    }

    echo "Iniciando carga de productos para el negocio ID: $business_id...\n";

    $stmt = $pdo->prepare("INSERT INTO products (business_id, name, description, price_usd, category, image_url) VALUES (?, ?, ?, ?, ?, ?)");

    foreach ($products as $p) {
        // Verificar si ya existe para no duplicar
        $check = $pdo->prepare("SELECT id FROM products WHERE name = ? AND business_id = ?");
        $check->execute([$p['name'], $business_id]);
        
        if ($check->fetch()) {
            echo "[-] Saltando '{$p['name']}' (ya existe).\n";
            continue;
        }

        $stmt->execute([
            $business_id,
            $p['name'],
            $p['description'],
            $p['price_usd'],
            $p['category'],
            $p['image_url']
        ]);
        echo "[+] Producto '{$p['name']}' insertado correctamente.\n";
    }

    echo "\nCarga finalizada con éxito.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
