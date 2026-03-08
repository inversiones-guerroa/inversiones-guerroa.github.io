@echo off
echo ========================================
echo   RESPALDO MANUAL - GUERROA C.A.
echo ========================================
echo.

set FECHA=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set FECHA=%FECHA: =0%
set CARPETA_RESPALDO=respaldo_%FECHA%

echo Creando respaldo en: %CARPETA_RESPALDO%
echo.

mkdir "%CARPETA_RESPALDO%"

echo Copiando archivos importantes...
xcopy /E /I /Y "public" "%CARPETA_RESPALDO%\public"
xcopy /E /I /Y "routes" "%CARPETA_RESPALDO%\routes"
xcopy /E /I /Y "database" "%CARPETA_RESPALDO%\database"
xcopy /E /I /Y "middleware" "%CARPETA_RESPALDO%\middleware"

copy /Y "server.js" "%CARPETA_RESPALDO%\"
copy /Y "package.json" "%CARPETA_RESPALDO%\"
copy /Y ".env" "%CARPETA_RESPALDO%\"

echo.
echo ========================================
echo   RESPALDO COMPLETADO
echo ========================================
echo Carpeta: %CARPETA_RESPALDO%
echo.
pause
