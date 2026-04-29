<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');

require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'Connection failed: ' . $e->getMessage()]));
}

// Verificar autenticación y negocio seleccionado
$n8n_token = 'optimus_n8n';
if (!isset($_SESSION['user_id']) || (!isset($_SESSION['business_id']) && !$_SESSION['is_super_admin'])) {
    if (($_GET['action'] ?? '') !== 'get_exchange_rate' && ($_GET['token'] ?? '') !== $n8n_token) {
        die(json_encode(['error' => 'No autorizado']));
    }
}

$business_id = $_SESSION['business_id'] ?? ($_GET['business_id'] ?? null);
$role = $_SESSION['role'] ?? null;
$is_super = $_SESSION['is_super_admin'] ?? false;
$action = $_GET['action'] ?? '';

switch ($action) {
    // --- PRODUCTOS ---
    case 'get_products':
        $stmt = $pdo->prepare("SELECT * FROM products WHERE business_id = ? AND active = 1");
        $stmt->execute([$business_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'save_product': // Crear o Editar
        if ($role !== 'administrador' && !$is_super) die(json_encode(['error' => 'Permiso denegado']));
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['id'])) {
            $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price_usd=?, category=?, image_url=? WHERE id=? AND business_id=?");
            $stmt->execute([$data['name'], $data['description'], $data['price_usd'], $data['category'], $data['image_url'], $data['id'], $business_id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO products (business_id, name, description, price_usd, category, image_url) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$business_id, $data['name'], $data['description'], $data['price_usd'], $data['category'], $data['image_url']]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'upload_image':
        if ($role !== 'administrador' && !$is_super) die(json_encode(['error' => 'Permiso denegado']));
        if (!isset($_FILES['image'])) die(json_encode(['error' => 'No se subió ninguna imagen']));
        
        $file = $_FILES['image'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];
        
        if (!in_array($ext, $allowed)) {
            die(json_encode(['error' => 'Formato no permitido. Solo JPG, PNG y WEBP.']));
        }

        $newName = uniqid() . '_' . time() . '.' . $ext;
        $target = __DIR__ . '/uploads/' . $newName;
        
        if (move_uploaded_file($file['tmp_name'], $target)) {
            echo json_encode(['success' => true, 'url' => 'uploads/' . $newName]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Error al guardar el archivo en el servidor.']);
        }
        break;

    case 'delete_product':
        if ($role !== 'administrador' && !$is_super) die(json_encode(['error' => 'Permiso denegado']));
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ? AND business_id = ?");
        $stmt->execute([$data['id'], $business_id]);
        echo json_encode(['success' => true]);
        break;

    // --- INGREDIENTES ---
    case 'get_ingredients':
        $stmt = $pdo->prepare("SELECT * FROM ingredients WHERE business_id = ? AND active = 1");
        $stmt->execute([$business_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
    
    case 'delete_order':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'];
        if ($role !== 'administrador' && !$is_super) die(json_encode(['error' => 'Permiso denegado']));
        $stmt = $pdo->prepare("SELECT is_paid, status FROM orders WHERE id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($order && $order['is_paid'] == 1 && ($order['status'] === 'listo' || $order['status'] === 'cobrado')) {
            die(json_encode(['error' => 'No se puede eliminar una orden que ya ha sido pagada y culminada.']));
        }

        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ? AND business_id = ?");
        $stmt->execute([$id, $business_id]);
        echo json_encode(['success' => true]);

        break;




    case 'save_ingredient':
        if ($role !== 'administrador' && !$is_super) die(json_encode(['error' => 'Permiso denegado']));
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['id'])) {
            $stmt = $pdo->prepare("UPDATE ingredients SET name=?, price_usd=? WHERE id=? AND business_id=?");
            $stmt->execute([$data['name'], $data['price_usd'], $data['id'], $business_id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO ingredients (business_id, name, price_usd) VALUES (?, ?, ?)");
            $stmt->execute([$business_id, $data['name'], $data['price_usd']]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'delete_ingredient':
        if ($role !== 'administrador' && !$is_super) die(json_encode(['error' => 'Permiso denegado']));
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM ingredients WHERE id = ? AND business_id = ?");
        $stmt->execute([$data['id'], $business_id]);
        echo json_encode(['success' => true]);
        break;

    // --- MESAS ---
    case 'get_tables':
        $stmt = $pdo->prepare("SELECT * FROM tables WHERE business_id = ? AND active = 1 ORDER BY name");
        $stmt->execute([$business_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'save_table':
        if ($role !== 'administrador' && !$is_super) die(json_encode(['error' => 'Permiso denegado']));
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['id'])) {
            $stmt = $pdo->prepare("UPDATE tables SET name=?, active=? WHERE id=? AND business_id=?");
            $stmt->execute([$data['name'], $data['active'] ?? 1, $data['id'], $business_id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO tables (business_id, name) VALUES (?, ?)");
            $stmt->execute([$business_id, $data['name']]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'delete_table':
        if ($role !== 'administrador' && !$is_super) die(json_encode(['error' => 'Permiso denegado']));
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM tables WHERE id = ? AND business_id = ?");
        $stmt->execute([$data['id'], $business_id]);
        echo json_encode(['success' => true]);
        break;

    // --- PEDIDOS ---
    case 'get_orders':
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE business_id = ? AND status != 'cobrado' ORDER BY created_at DESC");
        $stmt->execute([$business_id]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener items e ingredientes para cada orden
        foreach ($orders as &$order) {
            $stmt = $pdo->prepare("SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($order['items'] as &$item) {
                $stmt = $pdo->prepare("SELECT oii.*, i.name FROM order_item_ingredients oii JOIN ingredients i ON oii.ingredient_id = i.id WHERE oii.order_item_id = ?");
                $stmt->execute([$item['id']]);
                $item['ingredients'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

        }
        echo json_encode($orders);
        break;

    case 'get_history':
        if ($role !== 'administrador' && !$is_super) die(json_encode(['error' => 'Permiso denegado']));
        $date = $_GET['date'] ?? date('Y-m-d');
        $status = $_GET['status'] ?? '';
        $type = $_GET['type'] ?? '';
        $search = $_GET['search'] ?? '';

        $query = "SELECT * FROM orders WHERE business_id = ? AND DATE(created_at) = ?";
        $params = [$business_id, $date];

        if ($status) {
            $query .= " AND status = ?";
            $params[] = $status;
        }
        if ($type) {
            $query .= " AND order_type = ?";
            $params[] = $type;
        }
        if ($search) {
            $query .= " AND (customer_name LIKE ? OR id LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $query .= " ORDER BY created_at DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($orders as &$order) {
            $stmt = $pdo->prepare("SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        echo json_encode($orders);
        break;
    case 'create_order':
    case 'update_order':
        $data = json_decode(file_get_contents('php://input'), true);
        $pdo->beginTransaction();
        try {
            if ($action === 'create_order') {
                $stmt = $pdo->prepare("INSERT INTO orders (business_id, customer_name, customer_phone, order_type, table_number, total_usd, observations) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$business_id, $data['customer_name'], $data['customer_phone'], $data['order_type'], $data['table_number'] ?? null, $data['total_usd'], $data['observations']]);
                $order_id = $pdo->lastInsertId();
            } else {
                $order_id = $data['id'];
                $stmt = $pdo->prepare("UPDATE orders SET customer_name=?, customer_phone=?, order_type=?, table_number=?, total_usd=?, observations=? WHERE id=? AND business_id=?");
                $stmt->execute([$data['customer_name'], $data['customer_phone'], $data['order_type'], $data['table_number'] ?? null, $data['total_usd'], $data['observations'], $order_id, $business_id]);
                // Limpiar items anteriores para recrearlos (más simple para editar)
                $pdo->prepare("DELETE FROM order_items WHERE order_id = ?")->execute([$order_id]);
            }

            $stmt_item = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_time, observations) VALUES (?, ?, ?, ?, ?)");
            $stmt_extra = $pdo->prepare("INSERT INTO order_item_ingredients (order_item_id, ingredient_id, price_at_time) VALUES (?, ?, ?)");

            foreach ($data['items'] as $item) {
                $stmt_item->execute([$order_id, $item['id'], $item['quantity'] ?? 1, $item['price'], $item['observations'] ?? '']);
                $item_id = $pdo->lastInsertId();

                
                if (!empty($item['extras'])) {
                    foreach ($item['extras'] as $extra) {
                        $stmt_extra->execute([$item_id, $extra['id'], $extra['price']]);
                    }
                }
            }
            $pdo->commit();
            echo json_encode(['success' => true, 'order_id' => $order_id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
    case 'get_payments':
        $order_id = $_GET['order_id'] ?? 0;
        $stmt = $pdo->prepare("SELECT * FROM order_payments WHERE order_id = ?");
        $stmt->execute([$order_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'add_payment':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO order_payments (order_id, amount_original, currency, method, amount_usd) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$data['order_id'], $data['amount_original'], $data['currency'], $data['method'], $data['amount_usd']]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;

    case 'delete_payment':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM order_payments WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
        break;

    case 'process_payment':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'];
        // Marcar como pagado y si es para comer aquí, finalizar de una vez
        $pdo->prepare("UPDATE orders SET is_paid = 1, status = IF(order_type = 'comer_aqui' AND status = 'listo', 'cobrado', status) WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true]);
        break;


    case 'update_status':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ? AND business_id = ?");
        $stmt->execute([$data['status'], $data['id'], $business_id]);

        // Si se marca como COBRADO (Fin de la venta)
        if ($data['status'] === 'cobrado') {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
            $stmt->execute([$data['id']]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($order && $order['customer_phone']) {
                $customer_name = $order['customer_name'];
                $order_type = $order['order_type'];
                
                $msg_client = "✨ *¡Gracias por tu compra, {$customer_name}!* ✨\n\n";
                
                if ($order_type === 'llevar_delivery') {
                    $msg_client .= "🛵 Tu pedido está en camino. ¡Prepárate para disfrutar!\n";
                } else if ($order_type === 'llevar_retiro') {
                    $msg_client .= "🥡 Tu pedido está listo para ser retirado en nuestro local. ¡Te esperamos!\n";
                } else {
                    $msg_client .= "🍽️ Esperamos que hayas disfrutado tu comida con nosotros.\n";
                }

                $msg_client .= "\n🌟 Valoramos mucho tu preferencia. ¡Que tengas un futuro lleno de éxitos y momentos deliciosos! 🚀\n";
                $msg_client .= "_Los Calidad - Alimentando tus sueños._";

                sendWhatsApp($order['customer_phone'], $msg_client);
            }
        }
        echo json_encode(['success' => true]);
        break;

    case 'get_exchange_rate':
        try {
            // Consultamos la base de datos saludsonrisa directamente
            $stmt = $pdo->query("SELECT rate FROM saludsonrisa.exchange_rates WHERE source = 'BCV' AND `from` = 'USD' AND `to` = 'VES' ORDER BY date DESC, id DESC LIMIT 1");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $rate = $row ? (float)$row['rate'] : 36.50; // Fallback por si acaso
            echo json_encode(['rate' => $rate]);
        } catch (Exception $e) {
            echo json_encode(['rate' => 36.50, 'error' => $e->getMessage()]);
        }
        break;


    // --- SUPER ADMIN ---
    case 'get_businesses':
        if (!$is_super) die(json_encode(['error' => 'Solo Super Admin']));
        $stmt = $pdo->query("SELECT * FROM businesses");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'save_business':
        if (!$is_super) die(json_encode(['error' => 'Solo Super Admin']));
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['id'])) {
            $stmt = $pdo->prepare("UPDATE businesses SET name=?, active=? WHERE id=?");
            $stmt->execute([$data['name'], $data['active'], $data['id']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO businesses (name) VALUES (?)");
            $stmt->execute([$data['name']]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'get_users':
        if (!$is_super) die(json_encode(['error' => 'Solo Super Admin']));
        $stmt = $pdo->query("SELECT id, name, cedula, phone, is_super_admin FROM users");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'save_user':
        if (!$is_super) die(json_encode(['error' => 'Solo Super Admin']));
        $data = json_decode(file_get_contents('php://input'), true);
        $pass_hash = !empty($data['password']) ? password_hash($data['password'], PASSWORD_DEFAULT) : null;
        
        if (isset($data['id'])) {
            if ($pass_hash) {
                $stmt = $pdo->prepare("UPDATE users SET name=?, cedula=?, phone=?, password=? WHERE id=?");
                $stmt->execute([$data['name'], $data['cedula'], $data['phone'], $pass_hash, $data['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET name=?, cedula=?, phone=? WHERE id=?");
                $stmt->execute([$data['name'], $data['cedula'], $data['phone'], $data['id']]);
            }
        } else {
            $stmt = $pdo->prepare("INSERT INTO users (name, cedula, phone, password) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data['name'], $data['cedula'], $data['phone'], $pass_hash]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'delete_business':
        if (!$is_super) die(json_encode(['error' => 'Solo Super Admin']));
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM businesses WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
        break;

    case 'delete_user':
        if (!$is_super) die(json_encode(['error' => 'Solo Super Admin']));
        $data = json_decode(file_get_contents('php://input'), true);
        // No permitir eliminarse a sí mismo
        if ($data['id'] == $_SESSION['user_id']) die(json_encode(['error' => 'No puedes eliminarte a ti mismo']));
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
        break;

    case 'search_cedula':
        $raw_cedula = $_GET['cedula'] ?? '';
        if (!$raw_cedula) exit;
        
        // Normalizar cédula a solo números para consistencia
        $cedula = preg_replace('/\D/', '', $raw_cedula);
        
        // Primero buscar en base de datos local de clientes
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE business_id = ? AND cedula = ?");
        $stmt->execute([$business_id, $cedula]);
        $local = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($local) {
            echo json_encode($local);
        } else {
            // Si no existe, buscar en API externa (pasamos la original por si trae letra)
            $res = fetchCedulaData($raw_cedula);
            if ($res && (isset($res['p_nombre']) || isset($res['primer_nombre']) || isset($res['nombre']))) {
                // Mapear campos según los nombres detectados en quiniela y comunes
                $firstName = $res['primer_nombre'] ?? $res['nombre'] ?? $res['nombres'] ?? $res['p_nombre'] ?? '';
                $middleName = $res['segundo_nombre'] ?? $res['s_nombre'] ?? '';
                $lastName = $res['primer_apellido'] ?? $res['apellido'] ?? $res['apellidos'] ?? $res['p_apellido'] ?? '';
                $secondLastName = $res['segundo_apellido'] ?? $res['s_apellido'] ?? '';
                
                $fullName = trim("$firstName $middleName $lastName $secondLastName");
                echo json_encode([
                    'name' => mb_convert_case($fullName, MB_CASE_TITLE, "UTF-8"),
                    'cedula' => $cedula,
                    'phone' => ''
                ]);
            } else {

                echo json_encode(['error' => 'No encontrado']);
            }
        }
        break;

    case 'save_customer':
        $data = json_decode(file_get_contents('php://input'), true);
        $cedula = preg_replace('/\D/', '', $data['cedula']);
        $stmt = $pdo->prepare("INSERT INTO customers (business_id, name, cedula, phone) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone)");
        $stmt->execute([$business_id, $data['name'], $cedula, $data['phone']]);
        echo json_encode(['success' => true]);
        break;

    case 'get_dashboard_data':
        if ($role !== 'administrador' && !$is_super) die(json_encode(['error' => 'Permiso denegado']));
        
        // 1. Ventas diarias (últimos 7 días)
        $stmt = $pdo->prepare("SELECT DATE(created_at) as date, SUM(total_usd) as total FROM orders WHERE business_id = ? AND is_paid = 1 AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE(created_at) ORDER BY date ASC");
        $stmt->execute([$business_id]);
        $sales_daily = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 2. Productos más vendidos (Top 5)
        $stmt = $pdo->prepare("SELECT p.name, SUM(oi.quantity) as total_qty FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id WHERE o.business_id = ? AND o.is_paid = 1 GROUP BY p.id ORDER BY total_qty DESC LIMIT 5");
        $stmt->execute([$business_id]);
        $top_products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Actividad por hora (última semana)
        $stmt = $pdo->prepare("SELECT HOUR(created_at) as hour, COUNT(*) as total_orders FROM orders WHERE business_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY HOUR(created_at) ORDER BY hour ASC");
        $stmt->execute([$business_id]);
        $hourly_activity = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'sales_daily' => $sales_daily,
            'top_products' => $top_products,
            'hourly_activity' => $hourly_activity
        ]);
        break;

    case 'get_daily_report':
        $date = $_GET['date'] ?? date('Y-m-d');
        
        // Estadísticas generales del día
        $stmt = $pdo->prepare("SELECT SUM(total_usd) as total_usd, COUNT(*) as total_orders FROM orders WHERE business_id = ? AND DATE(created_at) = ? AND is_paid = 1");
        $stmt->execute([$business_id, $date]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // Top productos del día
        $stmt = $pdo->prepare("SELECT p.name, SUM(oi.quantity) as qty FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id WHERE o.business_id = ? AND DATE(o.created_at) = ? AND o.is_paid = 1 GROUP BY p.id ORDER BY qty DESC");
        $stmt->execute([$business_id, $date]);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'business' => $business_id,
            'date' => $date,
            'summary' => [
                'revenue_usd' => (float)($stats['total_usd'] ?? 0),
                'order_count' => (int)($stats['total_orders'] ?? 0)
            ],
            'products' => $products
        ]);
        break;

    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
