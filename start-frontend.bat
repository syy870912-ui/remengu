@echo off
chcp 65001 >nul
echo ========================================
echo   股析AI - 前端开发服务启动
echo ========================================
echo.

cd /d "%~dp0"

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

:: 检查依赖
if not exist node_modules (
    echo [安装] 正在安装前端依赖...
    npm install
)

echo [启动] 前端开发服务 (端口 5173)...
echo.
echo   前端地址: http://localhost:5173
echo   API 代理: /api -> http://localhost:8000
echo.
echo   确保后端服务已启动 (运行 start-backend.bat)
echo   按 Ctrl+C 停止服务
echo.

npx vite --host
