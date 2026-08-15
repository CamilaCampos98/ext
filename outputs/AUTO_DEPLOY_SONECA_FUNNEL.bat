@echo off
setlocal EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "REPO_DIR=%SCRIPT_DIR%.."
set "PORT=5179"
set "CHECK_SECONDS=60"
set "TAILSCALE_EXE="
set "NODE_EXE="
set "NPM_EXE="
set "PNPM_EXE="

where git >nul 2>nul
if errorlevel 1 (
  echo Git nao foi encontrado nesta maquina.
  echo Instale o Git, faca o clone do repositorio e execute novamente.
  pause
  exit /b 1
)

where tailscale >nul 2>nul
if %errorlevel%==0 set "TAILSCALE_EXE=tailscale"

if "%TAILSCALE_EXE%"=="" (
  if exist "C:\Program Files\Tailscale\tailscale.exe" set "TAILSCALE_EXE=C:\Program Files\Tailscale\tailscale.exe"
)

if "%TAILSCALE_EXE%"=="" (
  if exist "C:\Program Files (x86)\Tailscale\tailscale.exe" set "TAILSCALE_EXE=C:\Program Files (x86)\Tailscale\tailscale.exe"
)

if "%TAILSCALE_EXE%"=="" (
  echo Tailscale nao foi encontrado.
  echo Instale e faca login no Tailscale nesta maquina.
  pause
  exit /b 1
)

call :resolve_node
call :ensure_dependencies

pushd "%REPO_DIR%" >nul
git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  popd >nul
  echo Esta pasta nao parece ser um repositorio Git:
  echo %REPO_DIR%
  pause
  exit /b 1
)
popd >nul

echo Iniciando Tailscale Funnel em background na porta %PORT%...
"%TAILSCALE_EXE%" funnel --bg %PORT% >nul 2>nul

call :restart_server

:watch
call :check_for_updates
timeout /t %CHECK_SECONDS% /nobreak >nul
goto :watch

:check_for_updates
pushd "%REPO_DIR%" >nul

for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "BRANCH=%%B"
if "%BRANCH%"=="" (
  echo Nao consegui identificar a branch atual.
  popd >nul
  exit /b 0
)

git fetch origin %BRANCH% --quiet
if errorlevel 1 (
  echo [%date% %time%] Nao consegui consultar o Git remoto. Tentarei novamente.
  popd >nul
  exit /b 0
)

for /f "delims=" %%L in ('git rev-parse HEAD 2^>nul') do set "LOCAL_COMMIT=%%L"
for /f "delims=" %%R in ('git rev-parse origin/%BRANCH% 2^>nul') do set "REMOTE_COMMIT=%%R"

if "%LOCAL_COMMIT%"=="%REMOTE_COMMIT%" (
  popd >nul
  exit /b 0
)

git diff --quiet
if errorlevel 1 (
  echo [%date% %time%] Existe alteracao local nao commitada. Pull automatico pausado.
  popd >nul
  exit /b 0
)

git diff --cached --quiet
if errorlevel 1 (
  echo [%date% %time%] Existe alteracao staged local. Pull automatico pausado.
  popd >nul
  exit /b 0
)

echo.
echo [%date% %time%] Atualizacao encontrada em origin/%BRANCH%.
echo Fazendo pull...
git pull --ff-only origin %BRANCH%
if errorlevel 1 (
  echo [%date% %time%] Pull falhou. Verifique o Git manualmente.
  popd >nul
  exit /b 0
)

popd >nul
call :restart_server
exit /b 0

:resolve_node
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
  echo Instale o Node.js em https://nodejs.org/ e execute novamente.
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
exit /b 0

:ensure_dependencies
if exist "%SCRIPT_DIR%node_modules\web-push\package.json" exit /b 0

pushd "%SCRIPT_DIR%"
if not "%NPM_EXE%"=="" (
  echo Instalando dependencias do servidor...
  call "%NPM_EXE%" install
) else if not "%PNPM_EXE%"=="" (
  echo Instalando dependencias do servidor...
  call "%PNPM_EXE%" install
) else (
  echo A dependencia web-push ainda nao foi instalada e npm/pnpm nao foram encontrados.
  echo Instale o Node.js completo ou execute npm install na pasta outputs.
  popd
  pause
  exit /b 1
)

if errorlevel 1 (
  popd
  echo Falha ao instalar dependencias.
  pause
  exit /b 1
)
popd
exit /b 0

:restart_server
echo.
echo [%date% %time%] Reiniciando servidor local da Soneca...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*serve-soneca.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>nul
timeout /t 2 /nobreak >nul
start "Soneca PWA - servidor local" "%NODE_EXE%" "%SCRIPT_DIR%serve-soneca.js"
exit /b 0
