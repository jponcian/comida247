<?php
$host = 'localhost';
$db_name = 'comida247';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Limpiar tabla antes de insertar (opcional, pero ayuda a ver solo los nuevos)
    // $pdo->exec("TRUNCATE TABLE products");

    $products = [
        [
            'name' => 'Perro Caliente Sencillo',
            'description' => 'Salchicha, cebolla, papitas, salsas tradicionales.',
            'price_usd' => 2.50,
            'category' => 'Perros Calientes',
            'image_url' => 'https://images.unsplash.com/photo-1612392062631-94dd858cba88?auto=format&fit=crop&w=500&q=80'
        ],
        [
            'name' => 'Perro Caliente Especial',
            'description' => 'Salchicha, queso rallado, tocino, aguacate y salsas.',
            'price_usd' => 4.00,
            'category' => 'Perros Calientes',
            'image_url' => 'https://images.unsplash.com/photo-1541214113241-21578d2d9b62?auto=format&fit=crop&w=500&q=80'
        ],
        [
            'name' => 'Hamburguesa Clásica',
            'description' => 'Carne 150g, queso, lechuga, tomate y cebolla.',
            'price_usd' => 5.50,
            'category' => 'Hamburguesas',
            'image_url' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80'
        ],
        [
            'name' => 'Hamburguesa Mexicana',
            'description' => 'Carne, queso pepper jack, jalapeños y guacamole.',
            'price_usd' => 7.50,
            'category' => 'Hamburguesas',
            'image_url' => 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=500&q=80'
        ],
        [
            'name' => 'Pepito Mixto',
            'description' => 'Carne, pollo, queso, aguacate y papitas en pan artesanal.',
            'price_usd' => 8.00,
            'category' => 'Pepitos',
            'image_url' => 'https://images.unsplash.com/photo-1524350300359-455652631d87?auto=format&fit=crop&w=500&q=80'
        ],
        [
            'name' => 'Pepito de Pollo',
            'description' => 'Pollo a la plancha, queso, lechuga y salsas.',
            'price_usd' => 6.50,
            'category' => 'Pepitos',
            'image_url' => 'https://images.unsplash.com/photo-1481070414801-51fd732d7484?auto=format&fit=crop&w=500&q=80'
        ],
        [
            'name' => 'Shawarma Mixto',
            'description' => 'Carne y pollo, vegetales frescos, crema de ajo y tahini.',
            'price_usd' => 6.00,
            'category' => 'Shawarma',
            'image_url' => 'https://images.unsplash.com/photo-1561651823-34fed0225304?auto=format&fit=crop&w=500&q=80'
        ],
        [
            'name' => 'Shawarma de Carne',
            'description' => 'Carne marinada, hummus, vegetales y salsa de la casa.',
            'price_usd' => 5.00,
            'category' => 'Shawarma',
            'image_url' => 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=500&q=80'
        ],
        [
            'name' => 'Pizza Margarita',
            'description' => 'Salsa de tomate, mozzarella fresca y albahaca.',
            'price_usd' => 9.00,
            'category' => 'Pizza',
            'image_url' => 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&w=500&q=80'
        ],
        [
            'name' => 'Pizza Pepperoni',
            'description' => 'Mucho pepperoni y queso mozzarella premium.',
            'price_usd' => 11.00,
            'category' => 'Pizza',
            'image_url' => 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80'
        ]
    ];

    $stmt = $pdo->prepare("INSERT INTO products (name, description, price_usd, category, image_url) VALUES (?, ?, ?, ?, ?)");

    foreach ($products as $p) {
        $stmt->execute([$p['name'], $p['description'], $p['price_usd'], $p['category'], $p['image_url']]);
        echo "Insertado: " . $p['name'] . "\n";
    }

    echo "¡Sembrado de productos completado!";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
