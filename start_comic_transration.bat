@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo  AI Comic Translation Tool v1.0.0
echo  AI漫画翻訳ツール ローカル起動スクリプト
echo ============================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js が見つかりません。
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

if not exist node_modules (
    echo [INFO] Installing dependencies / 依存パッケージをインストール中...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install に失敗しました。
        pause
        exit /b
    )
)

echo.
echo [INFO] Launching development server...
echo [INFO] 開発サーバーを起動中...
echo [INFO] ブラウザが自動で開きます。開かない場合は http://localhost:5173/ にアクセスしてください。
echo.

call npm run dev -- --open

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] サーバーの起動に失敗しました。
    echo [ERROR] Failed to start server.
    pause
    exit /b
)
