@echo off
chcp 65001 >nul
echo ========================================
echo   股析AI - 后端服务启动
echo ========================================
echo.

cd /d "%~dp0"

:: 检查 Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python 3.11+
    pause
    exit /b 1
)

:: 检查依赖
echo [1/2] 检查依赖...
python -c "import fastapi" >nul 2>&1
if %errorlevel% neq 0 (
    echo [安装] 正在安装后端依赖...
    pip install -r backend/requirements.txt
)

echo [2/2] 启动后端服务 (端口 8000)...
echo.
echo   API 地址: http://localhost:8000
echo   API 文档: http://localhost:8000/docs
echo.
echo   按 Ctrl+C 停止服务
echo.

cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
