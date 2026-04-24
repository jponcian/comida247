<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'Connection failed: ' . $e->getMessage()]));
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        $data = json_decode(file_get_contents('php://input'), true);
        $cedula = $data['cedula'] ?? '';
        $pass = $data['password'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM users WHERE cedula = ?");
        $stmt->execute([$cedula]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($pass, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['is_super_admin'] = (bool)$user['is_super_admin'];
            
            // Obtener negocios del usuario
            if ($user['is_super_admin']) {
                $stmt = $pdo->query("SELECT id, name FROM businesses");
                $businesses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $stmt = $pdo->prepare("SELECT b.id, b.name, bu.role FROM businesses b JOIN business_user bu ON b.id = bu.business_id WHERE bu.user_id = ?");
                $stmt->execute([$user['id']]);
                $businesses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'is_super_admin' => $_SESSION['is_super_admin']
                ],
                'businesses' => $businesses
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Credenciales inválidas']);
        }
        break;

    case 'select_business':
        $data = json_decode(file_get_contents('php://input'), true);
        $business_id = $data['business_id'] ?? null;
        
        if (!$business_id) exit;

        // Verificar si el usuario tiene acceso a ese negocio
        if ($_SESSION['is_super_admin']) {
            $_SESSION['business_id'] = $business_id;
            $_SESSION['role'] = 'administrador';
            echo json_encode(['success' => true]);
        } else {
            $stmt = $pdo->prepare("SELECT role FROM business_user WHERE business_id = ? AND user_id = ?");
            $stmt->execute([$business_id, $_SESSION['user_id']]);
            $role = $stmt->fetchColumn();
            
            if ($role) {
                $_SESSION['business_id'] = $business_id;
                $_SESSION['role'] = $role;
                echo json_encode(['success' => true, 'role' => $role]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Sin acceso a este negocio']);
            }
        }
        break;

    case 'check':
        if (isset($_SESSION['user_id'])) {
            echo json_encode([
                'logged_in' => true,
                'user' => [
                    'name' => $_SESSION['user_name'],
                    'is_super_admin' => $_SESSION['is_super_admin']
                ],
                'business_id' => $_SESSION['business_id'] ?? null,
                'role' => $_SESSION['role'] ?? null
            ]);
        } else {
            echo json_encode(['logged_in' => false]);
        }
        break;

    case 'logout':
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    default:
        echo json_encode(['error' => 'Acción no válida']);
        break;
}
