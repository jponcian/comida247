---
description: Actualizar proyecto (git, db, productos)
---

Este comando se encarga de traer las actualizaciones de git, reiniciar la base de datos con la estructura oficial e inyectar los productos con las nuevas imágenes.

// turbo-all
1. Ejecuta `git pull` para obtener los últimos cambios del repositorio.
2. Ejecuta `php scratch/apply_db.php` para aplicar la estructura de `database.sql`.
3. Ejecuta `php scratch/inject_food.php` para cargar los productos con las imágenes locales.
4. Limpia la caché del navegador (F5) para ver los cambios en el frontend.