@echo off
set "SCRIPT_DIR=%~dp0"

where node >nul 2>nul
if %errorlevel%==0 (
  node "%SCRIPT_DIR%serve-soneca.js"
  pause
  exit /b
)

set "CODEX_NODE=C:\Users\milag\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%CODEX_NODE%" (
  "%CODEX_NODE%" "%SCRIPT_DIR%serve-soneca.js"
  pause
  exit /b
)

echo Node.js nao foi encontrado nesta maquina.
echo.
echo Instale o Node.js em https://nodejs.org/ e execute este arquivo novamente.
echo.
pause
