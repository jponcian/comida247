<?php
// require_once 'api.php';

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
     
     // Obtener el ID del negocio (asumimos 1 por ahora o el primero)
     $stmt = $pdo->query("SELECT id FROM businesses LIMIT 1");
     $business = $stmt->fetch();
     $business_id = $business ? $business['id'] : 1;

     $products = [
         [
             'name' => 'Shawarma Premium',
             'description' => 'Carne de primera, vegetales frescos y salsa de la casa.',
             'price' => 6.50,
             'image' => 'shawarma_premium_1777311973029.png'
         ],
         [
             'name' => 'Pepito Mixto',
             'description' => 'Carne y pollo salteado, papitas, queso y explosión de salsas.',
             'price' => 8.00,
             'image' => 'pepito_mixto_1777311988190.png'
         ],
         [
             'name' => 'Metro Pepito',
             'description' => 'El gigante de la casa. Ideal para compartir entre 4.',
             'price' => 15.00,
             'image' => 'metro_pepito_1777312005099.png'
         ],
         [
             'name' => 'Pizza Pepperoni',
             'description' => 'Masa artesanal, mozzarella y el mejor pepperoni.',
             'price' => 10.00,
             'image' => 'pizza_pepperoni_1777312023157.png'
         ]
     ];

     $stmt = $pdo->prepare("INSERT INTO products (business_id, name, description, price_usd, image_url) VALUES (?, ?, ?, ?, ?)");
     
     foreach ($products as $p) {
         $stmt->execute([$business_id, $p['name'], $p['description'], $p['price'], $p['image']]);
     }

     echo "Productos inyectados con éxito";

} catch (\PDOException $e) {
     throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
