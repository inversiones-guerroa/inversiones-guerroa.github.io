@echo off
echo ========================================
echo   GUERROA C.A. - Panel de Administracion
echo ========================================
echo.

REM Agregar Node.js al PATH
set PATH=%PATH%;C:\Program Files\nodejs

echo Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js no se encuentra en el PATH.
    echo Intentando con ruta completa...
    "C:\Program Files\nodejs\node.exe" --version
    if %errorlevel% neq 0 (
        echo ERROR: Node.js no esta instalado correctamente.
        pause
        exit /b 1
    )
    set NODE_PATH=C:\Program Files\nodejs
    set NPM_PATH=C:\Program Files\nodejs\npm.cmd
) else (
    set NODE_PATH=node
    set NPM_PATH=npm
)

echo.
echo Instalando dependencias...
%NPM_PATH% install

if %errorlevel% neq 0 (
    echo ERROR: Fallo al instalar dependencias.
    echo Intentando limpiar cache...
    %NPM_PATH% cache clean --force
    %NPM_PATH% install
    if %errorlevel% neq 0 (
        echo ERROR: No se pudieron instalar las dependencias.
        pause
        exit /b 1
    )
)

echo.
echo Creando archivo de configuracion...
if not exist .env (
    copy env.example .env
    echo Archivo .env creado.
) else (
    echo Archivo .env ya existe.
)

echo.
echo ========================================
echo   INICIANDO PANEL DE ADMINISTRACION...
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

%NODE_PATH% server.js
