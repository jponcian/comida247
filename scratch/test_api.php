<?php
require_once 'config.php';

function fetchCedulaDataDebug($cedula) {
    $nacionalidad = 'V';
    $numero = preg_replace('/\D/', '', $cedula);
    $params = [
        'app_id' => CEDULA_API_ID,
        'token' => CEDULA_API_TOKEN,
        'nacionalidad' => $nacionalidad,
        'cedula' => $numero
    ];

    $urls = [
        "https://api.cedula.com.ve/api/v1?" . http_build_query($params),
        "https://api.cedula.com.ve/api/v1/search?" . http_build_query($params)
    ];

    foreach ($urls as $url) {
        echo "Intentando URL: $url\n";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);

        echo "HTTP Code: $http_code\n";
        if ($curl_error) echo "Curl Error: $curl_error\n";
        
        if ($http_code === 200 && $response) {
            echo "Respuesta: $response\n";
            return json_decode($response, true);
        }
    }
    return null;
}

$cedula = '13820854';
echo "Probando búsqueda de cédula: $cedula\n";
$result = fetchCedulaDataDebug($cedula);
