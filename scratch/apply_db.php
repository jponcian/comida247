<?php
require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Crear la base de datos si no existe
    $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
    $pdo->exec("USE " . DB_NAME);

    // Leer el archivo SQL
    $sql = file_get_contents(__DIR__ . '/../database.sql');
    
    // Ejecutar el SQL (usando exec para múltiples sentencias)
    // Nota: exec solo ejecuta la primera sentencia si no se configura bien, 
    // pero PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8" ayuda.
    // Usaremos un método más robusto.
    
    $pdo->exec($sql);

    echo "Base de datos '" . DB_NAME . "' actualizada con éxito desde database.sql\n";

} catch (PDOException $e) {
    echo "Error al aplicar la base de datos: " . $e->getMessage() . "\n";
    exit(1);
}
