<?php
require_once 'functions.php';

// Cargar variables de entorno
loadEnv(__DIR__ . '/.env');

date_default_timezone_set(getenv('TIMEZONE') ?: 'America/Caracas');

// Configuración de la Base de Datos
define('DB_HOST', getenv('DB_HOST'));
define('DB_NAME', getenv('DB_NAME'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));

// API Cedula.com.ve
define('CEDULA_API_ID', getenv('CEDULA_API_ID'));
define('CEDULA_API_TOKEN', getenv('CEDULA_API_TOKEN'));

// Evolution API (WhatsApp)
define('EVOLUTION_API_URL', getenv('EVOLUTION_API_URL'));
define('EVOLUTION_API_KEY', getenv('EVOLUTION_API_KEY'));
define('EVOLUTION_INSTANCE', getenv('EVOLUTION_INSTANCE'));
define('EVOLUTION_KITCHEN_NUMBER', getenv('EVOLUTION_KITCHEN_NUMBER'));

// N8N Configuration
define('N8N_TOKEN', getenv('N8N_TOKEN'));
define('N8N_URL', getenv('N8N_URL'));
