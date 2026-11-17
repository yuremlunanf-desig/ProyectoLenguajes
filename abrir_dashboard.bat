@echo off
rem Abre el dashboard comparativo SIN servidor: actualiza la copia de las metricas y lo abre en el navegador.
rem Hace falta Node.js (ya instalado para el proyecto). Doble clic para usarlo.
cd /d "%~dp0"
node dashboard\exportar_estatico.js --solo-datos
if errorlevel 1 (
  echo.
  echo No se pudieron actualizar los datos. Se abre la ultima copia guardada.
  pause
)
start "" "%~dp0dashboard\index.html"
