<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');

$host = 'localhost';
$db_name = 'comida247';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'Connection failed: ' . $e->getMessage()]));
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_products':
        $stmt = $pdo->query("SELECT * FROM products WHERE active = 1");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'get_orders':
        $stmt = $pdo->query("SELECT * FROM orders WHERE status != 'cobrado' ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'get_exchange_rate':
        try {
            // Conexión temporal a saludsonrisa para obtener la tasa
            $pdo_ss = new PDO("mysql:host=$host;dbname=saludsonrisa;charset=utf8", $username, $password);
            $stmt = $pdo_ss->query("SELECT rate FROM exchange_rates ORDER BY created_at DESC LIMIT 1");
            $rate = $stmt->fetchColumn();
            echo json_encode(['rate' => (float)$rate ?: 1]);
        } catch (Exception $e) {
            echo json_encode(['rate' => 36.50, 'warning' => 'Using fallback rate']); // Fallback por si no existe la tabla aún
        }
        break;

    case 'create_order':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) exit;

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO orders (customer_name, total_usd) VALUES (?, ?)");
            $stmt->execute([$data['customer_name'] ?? 'Cliente', $data['total_usd']]);
            $order_id = $pdo->lastInsertId();

            $stmt_item = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)");
            foreach ($data['items'] as $item) {
                $stmt_item->execute([$order_id, $item['id'], $item['quantity'], $item['price']]);
            }
            $pdo->commit();
            echo json_encode(['success' => true, 'order_id' => $order_id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    case 'update_status':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $data['id']]);
        echo json_encode(['success' => true]);
        break;

    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
