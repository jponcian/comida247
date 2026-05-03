<?php
require_once 'config.php';
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SELECT * FROM products");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $output = "<?php\n";
    $output .= "require_once __DIR__ . '/../config.php';\n\n";
    $output .= "\$dsn = \"mysql:host=\" . DB_HOST . \";dbname=\" . DB_NAME . \";charset=utf8mb4\";\n";
    $output .= "\$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];\n\n";
    $output .= "try {\n";
    $output .= "    \$pdo = new PDO(\$dsn, DB_USER, DB_PASS, \$options);\n";
    $output .= "    \$stmt_bus = \$pdo->query(\"SELECT id FROM businesses LIMIT 1\");\n";
    $output .= "    \$business_id = \$stmt_bus->fetchColumn() ?: 1;\n\n";
    $output .= "    // Limpiar productos existentes para evitar duplicados en la inyección\n";
    $output .= "    \$pdo->exec(\"DELETE FROM products WHERE business_id = \$business_id\");\n\n";
    $output .= "    \$products = " . var_export($products, true) . ";\n\n";
    $output .= "    \$stmt = \$pdo->prepare(\"INSERT INTO products (business_id, name, description, price_usd, category, image_url, active) VALUES (?, ?, ?, ?, ?, ?, ?)\");\n\n";
    $output .= "    foreach (\$products as \$p) {\n";
    $output .= "        \$stmt->execute([\$business_id, \$p['name'], \$p['description'], \$p['price_usd'], \$p['category'], \$p['image_url'], \$p['active']]);\n";
    $output .= "    }\n";
    $output .= "    echo \"Productos inyectados con éxito: \" . count(\$products) . \" items.\\n\";\n";
    $output .= "} catch (Exception \$e) {\n";
    $output .= "    echo \"Error: \" . \$e->getMessage();\n";
    $output .= "}\n";
    
    file_put_contents('scratch/inject_food.php', $output);
    echo "Script scratch/inject_food.php actualizado con los productos actuales.\n";
} catch (Exception $e) {
    echo $e->getMessage();
}
