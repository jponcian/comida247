---
description: Genera las apk
---

# Workflow de Despliegue de APKs Flutter

Este workflow describe los pasos necesarios para compilar y desplegar las aplicaciones móviles del sistema SomosSalud.

## Ubicación de los APKs
Todos los archivos APK públicos deben alojarse en la carpeta:
`public/apks/`

## Nombres Estándar de Archivos
- **App Pacientes**: `app-pacientes.apk`
- **App Especialistas (Doctores)**: `app-especialistas.apk`
- **App Administrativa (Clínica)**: `app-administrativa.apk`

---

## Pasos para el Despliegue

### 1. Incrementar Versión en Flutter
Antes de compilar, asegúrate de incrementar la versión en el archivo `pubspec.yaml` de la aplicación correspondiente.
- Ruta Paciente: `app_somossalud/pubspec.yaml`
- Ruta Doctor: `app_somossalud_doctor/pubspec.yaml`

Modifica la línea `version: X.X.X+Y`:
- `X.X.X`: Versión semántica (Ej: 1.1.1)
- `Y`: Número de compilación (build number)

### 2. Compilar APK Release
// turbo-all
Corre el siguiente comando en el directorio de la app:
```powershell
flutter build apk --release
```

### 3. Despliegue en el Portal (Carpeta `public/apks`)
Copia el archivo generado al directorio público del portal web.

**Para Pacientes:**
```powershell
copy "app_somossalud\build\app\outputs\flutter-apk\app-release.apk" "public\apks\app-pacientes.apk"
```

**Para Especialistas:**
```powershell
copy "app_somossalud_doctor\build\app\outputs\flutter-apk\app-release.apk" "public\apks\app-especialistas.apk"
```

### 4. Actualizar Versión en el Portal Web
Modifica el archivo `resources/views/landing.blade.php` para reflejar el nuevo número de versión en la sección de "EXPERIENCIA MÓVIL".

---

## REGLA CRÍTICA
**NUNCA** coloques los APKs en `public/downloads/` u otras carpetas. Los enlaces de la página principal están configurados para apuntar a `public/apks/`.
