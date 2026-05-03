<?php
require_once __DIR__ . '/../config.php';

$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];

try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    $stmt_bus = $pdo->query("SELECT id FROM businesses LIMIT 1");
    $business_id = $stmt_bus->fetchColumn() ?: 1;

    // Limpiar productos existentes para evitar duplicados en la inyección
    $pdo->exec("DELETE FROM products WHERE business_id = $business_id");

    $products = array (
  0 => 
  array (
    'id' => 12,
    'business_id' => 1,
    'name' => 'Club House',
    'description' => '300 gr de carne, 200 gr de papas fritas naturales, Sandwich con Huevo, Jamón, Queso amarillo, Lechuga, Tomate y salsas.',
    'price_usd' => '12.00',
    'category' => 'Especiales',
    'image_url' => 'uploads/club_house_los_calidad_1777750032949.png',
    'active' => 1,
  ),
  1 => 
  array (
    'id' => 10,
    'business_id' => 1,
    'name' => 'Parrilla Los Calidad',
    'description' => '500gr de carne, Papas fritas naturales y Ensalada de cebolla, Tomate y Lechuga.',
    'price_usd' => '12.00',
    'category' => 'Especiales',
    'image_url' => 'uploads/parrilla_los_calidad_1777749964845.png',
    'active' => 1,
  ),
  2 => 
  array (
    'id' => 11,
    'business_id' => 1,
    'name' => 'Salchipapas',
    'description' => '200gr de papas fritas naturales, Salchicha de pollo, Queso amarillo y salsas.',
    'price_usd' => '6.00',
    'category' => 'Especiales',
    'image_url' => 'uploads/salchipapas_v2.png',
    'active' => 1,
  ),
  3 => 
  array (
    'id' => 9,
    'business_id' => 1,
    'name' => 'Shawarma Mixto',
    'description' => 'Pan Árabe, Carne y Pollo, Lechuga, Tomate, Salsa pampero, Salsa de ajo, Salsa de queso cheddar.',
    'price_usd' => '7.00',
    'category' => 'Especiales',
    'image_url' => 'uploads/shawarma_mixto_los_calidad_1777749876535.png',
    'active' => 1,
  ),
  4 => 
  array (
    'id' => 8,
    'business_id' => 1,
    'name' => 'Shawarma de Pollo',
    'description' => 'Pan Árabe, Pollo, Lechuga, Tomate, Salsa pampero, Salsa de ajo, Salsa de queso cheddar.',
    'price_usd' => '7.00',
    'category' => 'Especiales',
    'image_url' => 'uploads/shawarma_mixto_los_calidad_1777749876535.png',
    'active' => 1,
  ),
  5 => 
  array (
    'id' => 7,
    'business_id' => 1,
    'name' => 'Shawarma de Carne',
    'description' => 'Pan Árabe, Carne, Lechuga, Tomate, Salsa pampero, Salsa de ajo, Salsa de queso cheddar.',
    'price_usd' => '7.00',
    'category' => 'Especiales',
    'image_url' => 'uploads/shawarma_mixto_los_calidad_1777749876535.png',
    'active' => 1,
  ),
  6 => 
  array (
    'id' => 13,
    'business_id' => 1,
    'name' => 'Sandwich Especial',
    'description' => 'Sandwich con Pollo o Carne, Huevo, Jamón, Queso amarillo, Lechuga, Tomate y salsas.',
    'price_usd' => '4.00',
    'category' => 'Especiales',
    'image_url' => 'uploads/sandwich_especial_v2.png',
    'active' => 1,
  ),
  7 => 
  array (
    'id' => 14,
    'business_id' => 1,
    'name' => 'Ración de Papas Fritas',
    'description' => 'Papas fritas naturales crujientes.',
    'price_usd' => '4.00',
    'category' => 'Especiales',
    'image_url' => 'uploads/papas_fritas_v2.png',
    'active' => 1,
  ),
  8 => 
  array (
    'id' => 15,
    'business_id' => 1,
    'name' => 'Hamburguesa Normal',
    'description' => 'Pan Bimbo, Carne, Lechuga, Tomate, Repollo, Papitas y salsas.',
    'price_usd' => '4.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_especial_los_calidad_1777749894077.png',
    'active' => 1,
  ),
  9 => 
  array (
    'id' => 16,
    'business_id' => 1,
    'name' => 'Hamburguesa Especial',
    'description' => 'Pan Bimbo, Carne, Huevo, Jamón y Queso amarillo, Lechuga, Tomate, Repollo, Papitas y salsas.',
    'price_usd' => '5.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_especial_los_calidad_1777749894077.png',
    'active' => 1,
  ),
  10 => 
  array (
    'id' => 17,
    'business_id' => 1,
    'name' => 'Hamburguesa de Pollo',
    'description' => 'Pan Bimbo, Pollo, Huevo, Jamón y Queso amarillo, Lechuga, Tomate, Repollo, Papitas y salsas.',
    'price_usd' => '6.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_especial_los_calidad_1777749894077.png',
    'active' => 1,
  ),
  11 => 
  array (
    'id' => 18,
    'business_id' => 1,
    'name' => 'Hamburguesa de Chuleta',
    'description' => 'Chuleta, Huevo, Jamón y Queso amarillo, Lechuga, Tomate, Repollo, Papitas y salsas.',
    'price_usd' => '7.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_especial_los_calidad_1777749894077.png',
    'active' => 1,
  ),
  12 => 
  array (
    'id' => 19,
    'business_id' => 1,
    'name' => 'Hamburguesa Mixta',
    'description' => 'Pan Bimbo, Carne, Pollo, Huevo, Jamón y Queso amarillo, Lechuga, Tomate, Repollo, Papitas y salsas.',
    'price_usd' => '8.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_especial_los_calidad_1777749894077.png',
    'active' => 1,
  ),
  13 => 
  array (
    'id' => 20,
    'business_id' => 1,
    'name' => 'Hamburguesa Smash',
    'description' => 'Pan Bimbo, Doble carne de hamburguesa, Doble queso amarillo, Pepinillos, cebolla caramelizada (opcional).',
    'price_usd' => '7.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_smash_los_calidad_1777749979126.png',
    'active' => 1,
  ),
  14 => 
  array (
    'id' => 21,
    'business_id' => 1,
    'name' => 'Hamburguesa de Pollo Crispy',
    'description' => 'Pan Bimbo, 150 gr de Pollo cryspy, Queso amarillo, Lechuga, Tomate y salsas.',
    'price_usd' => '8.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_especial_los_calidad_1777749894077.png',
    'active' => 1,
  ),
  15 => 
  array (
    'id' => 22,
    'business_id' => 1,
    'name' => 'Anita Burger',
    'description' => 'Pan de Lechuga fresca, Carne, Huevo, Jamón y Queso amarillo, Tomate, Repollo, Papitas y salsas.',
    'price_usd' => '6.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_especial_los_calidad_1777749894077.png',
    'active' => 1,
  ),
  16 => 
  array (
    'id' => 23,
    'business_id' => 1,
    'name' => 'Hamburguesa Bacon',
    'description' => 'Pan Bimbo, Carne, Huevo, Jamón, Queso amarillo, Tocineta, Lechuga, Tomate, Repollo, Papitas y salsas.',
    'price_usd' => '7.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_especial_los_calidad_1777749894077.png',
    'active' => 1,
  ),
  17 => 
  array (
    'id' => 24,
    'business_id' => 1,
    'name' => 'Hamburguesa Doble',
    'description' => 'Pan Bimbo, Doble carne, Huevo, Jamón, Queso amarillo, Lechuga, Tomate, Repollo, Papitas y salsas.',
    'price_usd' => '7.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_especial_los_calidad_1777749894077.png',
    'active' => 1,
  ),
  18 => 
  array (
    'id' => 25,
    'business_id' => 1,
    'name' => 'Hamburguesa Triple',
    'description' => 'Pan Bimbo, Carne, Pollo, Chuleta ahumada, Huevo, Jamón, Queso amarillo, Lechuga, Tomate, Repollo, Papitas y salsas.',
    'price_usd' => '10.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_especial_los_calidad_1777749894077.png',
    'active' => 1,
  ),
  19 => 
  array (
    'id' => 26,
    'business_id' => 1,
    'name' => 'Hamburguesa Glotona',
    'description' => 'Pan Bimbo, Carne de hamburguesa, Carne de Pepito, Huevo, Jamón y Queso amarillo, Lechuga, Tomate, Repollo, Papitas perreras, papas fritas naturales y salsas.',
    'price_usd' => '9.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/hamburguesa_especial_los_calidad_1777749894077.png',
    'active' => 1,
  ),
  20 => 
  array (
    'id' => 27,
    'business_id' => 1,
    'name' => 'Rueda de Camión',
    'description' => 'Pan gigante, 600 gr de Carne, Huevo, Jamón, Queso amarillo, Lechuga, Tomate, Repollo, Papitas perreras, papas fritas naturales y salsas.',
    'price_usd' => '35.00',
    'category' => 'Hamburguesas',
    'image_url' => 'uploads/rueda_de_camion_los_calidad_1777749907505.png',
    'active' => 1,
  ),
  21 => 
  array (
    'id' => 28,
    'business_id' => 1,
    'name' => 'Perro Normal',
    'description' => 'Pan, salchicha, repollo, papitas, salsas y queso de Año.',
    'price_usd' => '2.50',
    'category' => 'Perros Calientes',
    'image_url' => 'uploads/perro_normal_los_calidad_1777752065921.png',
    'active' => 1,
  ),
  22 => 
  array (
    'id' => 29,
    'business_id' => 1,
    'name' => 'Perro Especial',
    'description' => 'Pan, salchicha, repollo, papitas, salsas, jamón y queso amarillo.',
    'price_usd' => '3.50',
    'category' => 'Perros Calientes',
    'image_url' => 'uploads/perro_especial_v2.png',
    'active' => 1,
  ),
  23 => 
  array (
    'id' => 30,
    'business_id' => 1,
    'name' => 'Perro Polaco',
    'description' => 'Pan, salchicha polaca, lechuga, tomate, salsas, jamón, queso amarillo y papas fritas naturales.',
    'price_usd' => '5.00',
    'category' => 'Perros Calientes',
    'image_url' => 'uploads/perro_polaco_v2.png',
    'active' => 1,
  ),
  24 => 
  array (
    'id' => 31,
    'business_id' => 1,
    'name' => 'Perro Alemán',
    'description' => 'Pan Bimbo, salchicha alemana, pepinillos, cebolla morada, salsa roja y mostaza.',
    'price_usd' => '3.50',
    'category' => 'Perros Calientes',
    'image_url' => 'uploads/perro_aleman_v2.png',
    'active' => 1,
  ),
  25 => 
  array (
    'id' => 32,
    'business_id' => 1,
    'name' => 'Pepito de Pollo',
    'description' => 'Pan, Pollo, tomate, lechuga, repollo, papitas perreras, papas fritas naturales, todas las salsas y queso amarillo.',
    'price_usd' => '12.00',
    'category' => 'Pepitos',
    'image_url' => 'uploads/pepito_pollo_v2.png',
    'active' => 1,
  ),
  26 => 
  array (
    'id' => 33,
    'business_id' => 1,
    'name' => 'Pepito de Carne',
    'description' => 'Pan, carne, tomate, lechuga, repollo, papitas perreras, papas fritas naturales, todas las salsas y queso amarillo.',
    'price_usd' => '12.00',
    'category' => 'Pepitos',
    'image_url' => 'uploads/pepito_carne_v2.png',
    'active' => 1,
  ),
  27 => 
  array (
    'id' => 34,
    'business_id' => 1,
    'name' => 'Pepito Mixto',
    'description' => 'Pan, mitad carne, mitad pollo, tomate, lechuga, repollo, papitas perreras, papas fritas naturales, todas las salsas y queso amarillo.',
    'price_usd' => '12.00',
    'category' => 'Pepitos',
    'image_url' => 'uploads/pepito_mixto_v2.png',
    'active' => 1,
  ),
  28 => 
  array (
    'id' => 35,
    'business_id' => 1,
    'name' => 'Metro Pepito',
    'description' => 'Pan, carne o pollo, huevo, jamón, tocineta, Chuleta Ahumada, lechuga, repollo, papitas perreras, papas fritas naturales, todas las salsas y queso amarillo.',
    'price_usd' => '40.00',
    'category' => 'Pepitos',
    'image_url' => 'uploads/metro_pepito_los_calidad_1777749996602.png',
    'active' => 1,
  ),
  29 => 
  array (
    'id' => 36,
    'business_id' => 1,
    'name' => '1/2 Metro Pepito',
    'description' => 'Pan, carne o pollo, huevo, jamón, tocineta, chuleta ahumada, tomate, lechuga, repollo, papitas perreras, papas fritas naturales, todas las salsas y queso amarillo.',
    'price_usd' => '20.00',
    'category' => 'Pepitos',
    'image_url' => 'uploads/metro_pepito_los_calidad_1777749996602.png',
    'active' => 1,
  ),
  30 => 
  array (
    'id' => 37,
    'business_id' => 1,
    'name' => 'Mini Pepito',
    'description' => 'Pan, proteína elegida, tomate, lechuga, repollo, papitas perreras, papas fritas naturales, todas las salsas y queso amarillo.',
    'price_usd' => '6.50',
    'category' => 'Pepitos',
    'image_url' => 'uploads/pepito_mixto_los_calidad_1777749920807.png',
    'active' => 1,
  ),
  31 => 
  array (
    'id' => 38,
    'business_id' => 1,
    'name' => 'Pepito Titanic',
    'description' => 'Pan, tomate, lechuga, repollo, papitas perreras, papas fritas naturales, todas las salsas, queso amarillo, huevo, jamón, tocineta y chuleta ahumada.',
    'price_usd' => '15.00',
    'category' => 'Pepitos',
    'image_url' => 'uploads/pepito_mixto_los_calidad_1777749920807.png',
    'active' => 1,
  ),
  32 => 
  array (
    'id' => 39,
    'business_id' => 1,
    'name' => 'Pizza Margarita',
    'description' => 'Salsa y Queso Mozzarella.',
    'price_usd' => '9.00',
    'category' => 'Pizzas',
    'image_url' => 'uploads/pizza_margarita_los_calidad_1777751988456.png',
    'active' => 1,
  ),
  33 => 
  array (
    'id' => 40,
    'business_id' => 1,
    'name' => 'Pizza Napolitana',
    'description' => 'Salsa, Queso Mozzarella y Anchoas.',
    'price_usd' => '10.00',
    'category' => 'Pizzas',
    'image_url' => 'uploads/pizza_napolitana_los_calidad_1777752001087.png',
    'active' => 1,
  ),
  34 => 
  array (
    'id' => 41,
    'business_id' => 1,
    'name' => 'Pizza Especial',
    'description' => 'Salsa, Queso Mozzarella y Jamón.',
    'price_usd' => '10.00',
    'category' => 'Pizzas',
    'image_url' => 'uploads/pizza_especial_los_calidad_1777752013856.png',
    'active' => 1,
  ),
  35 => 
  array (
    'id' => 42,
    'business_id' => 1,
    'name' => 'Pizza Especial con Tocineta',
    'description' => 'Salsa, Queso Mozzarella, Jamón y Tocineta.',
    'price_usd' => '11.00',
    'category' => 'Pizzas',
    'image_url' => 'uploads/pizza_especial_tocineta_los_calidad_1777752028312.png',
    'active' => 1,
  ),
  36 => 
  array (
    'id' => 43,
    'business_id' => 1,
    'name' => 'Pizza Pepperoni',
    'description' => 'Salsa, Queso Mozzarella y Pepperoni.',
    'price_usd' => '11.00',
    'category' => 'Pizzas',
    'image_url' => 'uploads/pizza_pepperoni_los_calidad_v2_1777752040871.png',
    'active' => 1,
  ),
  37 => 
  array (
    'id' => 44,
    'business_id' => 1,
    'name' => 'Pizza Los Calidad',
    'description' => 'Salsa, Queso Mozzarella, Jamón, Salchichón, Champiñón y Queso Pecorino.',
    'price_usd' => '14.00',
    'category' => 'Pizzas',
    'image_url' => 'uploads/pizza_los_calidad_1777749932870.png',
    'active' => 1,
  ),
  38 => 
  array (
    'id' => 45,
    'business_id' => 1,
    'name' => 'Pizza 4 Estaciones',
    'description' => 'Salsa, Queso Mozzarella, Jamón, Salchichón, Pimentón y Tocineta.',
    'price_usd' => '11.00',
    'category' => 'Pizzas',
    'image_url' => 'uploads/pizza_4_estaciones_los_calidad_1777752053103.png',
    'active' => 1,
  ),
  39 => 
  array (
    'id' => 46,
    'business_id' => 1,
    'name' => 'Refresco 350ml',
    'description' => 'Bebida gaseosa personal.',
    'price_usd' => '1.00',
    'category' => 'Bebidas',
    'image_url' => 'uploads/refresco_350ml_v2.png',
    'active' => 1,
  ),
  40 => 
  array (
    'id' => 47,
    'business_id' => 1,
    'name' => 'Refresco 1.25L',
    'description' => 'Bebida gaseosa familiar.',
    'price_usd' => '3.00',
    'category' => 'Bebidas',
    'image_url' => 'uploads/refresco_1_25l_v2.png',
    'active' => 1,
  ),
  41 => 
  array (
    'id' => 48,
    'business_id' => 1,
    'name' => 'Agua Nevada',
    'description' => 'Agua mineral.',
    'price_usd' => '1.00',
    'category' => 'Bebidas',
    'image_url' => 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=500&q=80',
    'active' => 1,
  ),
  42 => 
  array (
    'id' => 49,
    'business_id' => 1,
    'name' => 'Cerveza Polar',
    'description' => 'Cerveza nacional.',
    'price_usd' => '0.80',
    'category' => 'Bebidas',
    'image_url' => 'uploads/cerveza_polar_v2.png',
    'active' => 1,
  ),
  43 => 
  array (
    'id' => 50,
    'business_id' => 1,
    'name' => 'Nestea',
    'description' => 'Té frío.',
    'price_usd' => '2.00',
    'category' => 'Bebidas',
    'image_url' => 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=500&q=80',
    'active' => 1,
  ),
);

    $stmt = $pdo->prepare("INSERT INTO products (business_id, name, description, price_usd, category, image_url, active) VALUES (?, ?, ?, ?, ?, ?, ?)");

    foreach ($products as $p) {
        $stmt->execute([$business_id, $p['name'], $p['description'], $p['price_usd'], $p['category'], $p['image_url'], $p['active']]);
    }
    echo "Productos inyectados con éxito: " . count($products) . " items.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
