@echo off
setlocal EnableDelayedExpansion
set "SCRIPT_DIR=%~dp0"
set "NODE_EXE="
set "NPM_EXE="
set "PNPM_EXE="

for /f "delims=" %%I in ('where node 2^>nul') do (
  echo %%I | find /I "%SCRIPT_DIR%node_modules" >nul
  if errorlevel 1 if "!NODE_EXE!"=="" set "NODE_EXE=%%I"
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

for %%I in ("%NODE_EXE%") do (
  if exist "%%~dpInpm.cmd" set "NPM_EXE=%%~dpInpm.cmd"
  if exist "%%~dpIpnpm.cmd" set "PNPM_EXE=%%~dpIpnpm.cmd"
)

if "%NPM_EXE%"=="" (
  for /f "delims=" %%I in ('where npm 2^>nul') do (
    echo %%I | find /I "%SCRIPT_DIR%node_modules" >nul
    if errorlevel 1 if "!NPM_EXE!"=="" set "NPM_EXE=%%I"
  )
)

if "%PNPM_EXE%"=="" (
  for /f "delims=" %%I in ('where pnpm 2^>nul') do (
    echo %%I | find /I "%SCRIPT_DIR%node_modules" >nul
    if errorlevel 1 if "!PNPM_EXE!"=="" set "PNPM_EXE=%%I"
  )
)

if not exist "%SCRIPT_DIR%node_modules\web-push\package.json" (
  if not "%NPM_EXE%"=="" (
    echo Instalando dependencias do servidor...
    call "%NPM_EXE%" install --prefix "%SCRIPT_DIR%"
  ) else if not "%PNPM_EXE%"=="" (
    echo Instalando dependencias do servidor...
    call "%PNPM_EXE%" install --dir "%SCRIPT_DIR%"
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
