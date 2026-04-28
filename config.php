<?php
date_default_timezone_set('America/Caracas');

// Configuración de la Base de Datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'comida247');
define('DB_USER', 'root');
define('DB_PASS', '');

// API Cedula.com.ve
define('CEDULA_API_ID', '2014');
define('CEDULA_API_TOKEN', '718e73fc92191e60ffda1fd2c1ec0ee4');

// Evolution API (WhatsApp)
define('EVOLUTION_API_URL', 'http://127.0.0.1:8080');
define('EVOLUTION_API_KEY', 'optimus');
define('EVOLUTION_INSTANCE', 'default');
define('EVOLUTION_KITCHEN_NUMBER', '584121234567'); // Número que recibirá las comandas

/**
 * Función para consultar datos por cédula
 */
function fetchCedulaData($cedula) {
    $nacionalidad = 'V';
    $numero = preg_replace('/\D/', '', $cedula);

    // Extraer nacionalidad si viene en formato V-12345678 o V12345678
    if (preg_match('/^([VEJGP])[-]?(\d+)/i', $cedula, $matches)) {
        $nacionalidad = strtoupper($matches[1]);
        $numero = $matches[2];
    }

    if (!$numero) return null;
    
    $params = [
        'app_id' => CEDULA_API_ID,
        'token' => CEDULA_API_TOKEN,
        'nacionalidad' => $nacionalidad,
        'cedula' => $numero
    ];

    $url = "https://api.cedula.com.ve/api/v1?" . http_build_query($params);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) return null;
    
    $result = json_decode($response, true);
    return $result['data'] ?? $result['payload'] ?? $result;
}

/**
 * Función para enviar mensaje por WhatsApp via Evolution API
 */
function sendWhatsApp($number, $message) {
    // Limpiar número (asumimos formato internacional si es necesario)
    $number = preg_replace('/\D/', '', $number);
    if (strlen($number) == 10) $number = "58" . $number; // Ejemplo para Venezuela si falta el 58

    $url = EVOLUTION_API_URL . "/message/sendText/" . EVOLUTION_INSTANCE;
    $data = [
        "number" => $number,
        "text" => $message
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . EVOLUTION_API_KEY
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}
