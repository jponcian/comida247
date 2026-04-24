<?php
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
    $url = "https://api.cedula.com.ve/api/v1/search?id=" . CEDULA_API_ID . "&token=" . CEDULA_API_TOKEN . "&cedula=" . $cedula;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
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
