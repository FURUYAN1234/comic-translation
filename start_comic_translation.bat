@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   AI Comic Translation Tool - Starting...
echo ============================================

where node >nul 2>nul
if errorlevel 1 goto NODE_MISSING

where npm >nul 2>nul
if errorlevel 1 goto NPM_MISSING

if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
)

if not exist node_modules goto INSTALL_ERROR

echo [INFO] Launching development server...
call npm run dev -- --open

if errorlevel 1 goto RUN_ERROR

pause
exit /b

:NODE_MISSING
echo [ERROR] Node.js is not installed.
echo Please install Node.js from https://nodejs.org/
pause
exit /b

:NPM_MISSING
echo [ERROR] npm is not found.
pause
exit /b

:INSTALL_ERROR
echo [ERROR] Installation failed.
pause
exit /b

:RUN_ERROR
echo [ERROR] Failed to start server.
pause
exit /b
