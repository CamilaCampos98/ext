@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "NODE_EXE="
set "NPM_EXE="
set "PNPM_EXE="

where node >nul 2>nul
if %errorlevel%==0 (
  set "NODE_EXE=node"
)

if "%NODE_EXE%"=="" (
  set "CODEX_NODE=C:\Users\milag\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if exist "%CODEX_NODE%" set "NODE_EXE=%CODEX_NODE%"
)

if "%NODE_EXE%"=="" (
  echo Node.js nao foi encontrado nesta maquina.
  echo.
  echo Instale o Node.js em https://nodejs.org/ e execute este arquivo novamente.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if %errorlevel%==0 set "NPM_EXE=npm"
where pnpm >nul 2>nul
if %errorlevel%==0 set "PNPM_EXE=pnpm"

if not exist "%SCRIPT_DIR%node_modules\web-push\package.json" (
  if not "%NPM_EXE%"=="" (
    echo Instalando dependencias do servidor...
    "%NPM_EXE%" install --prefix "%SCRIPT_DIR%"
  ) else if not "%PNPM_EXE%"=="" (
    echo Instalando dependencias do servidor...
    "%PNPM_EXE%" install --dir "%SCRIPT_DIR%"
  ) else (
    echo A dependencia web-push ainda nao foi instalada e npm/pnpm nao foram encontrados.
    echo Instale o Node.js completo ou execute npm install na pasta outputs.
    pause
    exit /b 1
  )
  if errorlevel 1 (
    echo Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)

"%NODE_EXE%" "%SCRIPT_DIR%serve-soneca.js"
pause
