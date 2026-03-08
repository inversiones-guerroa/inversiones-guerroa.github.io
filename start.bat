@echo off
echo ========================================
echo   GUERROA C.A. - Sitio Web Profesional
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado.
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado: 
node --version

echo.
echo Instalando dependencias...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Fallo al instalar dependencias.
    pause
    exit /b 1
)

echo.
echo Creando archivo de configuracion...
if not exist .env (
    copy env.example .env
    echo Archivo .env creado. Puedes editarlo si necesitas cambiar configuraciones.
) else (
    echo Archivo .env ya existe.
)

echo.
echo ========================================
echo   INICIANDO SERVIDOR...
echo ========================================
echo.
echo Sitio web: http://localhost:3000
echo Panel admin: http://localhost:3000/admin
echo Login: http://localhost:3000/login
echo.
echo Credenciales por defecto:
echo Usuario: admin
echo Contraseña: admin123
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

npm start
