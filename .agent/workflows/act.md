---
description: Actualizar proyecto (git, composer, migraciones, npm)
---

Este comando se encarga de traer las actualizaciones de git, instalar dependencias de composer, correr las migraciones de base de datos e instalar/compilar los paquetes de node, además de limpiar caché.

// turbo-all
1. Ejecuta `git pull` para obtener los últimos cambios del repositorio.
2. Ejecuta `composer install` para actualizar las dependencias de PHP.
3. Ejecuta `php artisan migrate --force` para aplicar los cambios en la base de datos.
4. Ejecuta `npm install` para actualizar las dependencias de Node.js.
5. Ejecuta `npm run build` para compilar los activos del frontend (Vite).
6. Ejecuta `php artisan optimize:clear` para limpiar caché de configuración, rutas, vistas y eventos.
7. Ejecuta `php artisan view:cache` para pre-compilar las vistas (opcional pero recomendado para evitar el primer delay).