#!/usr/bin/env bash
set -euo pipefail

echo "=== 安装 Node.js 依赖 ==="
npm install

echo "=== 构建前端 ==="
npm run build

echo "=== 安装 Python 依赖 ==="
cd backend
pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo "=== 构建完成 ==="
ls -la dist/ || echo "dist/ 目录不存在！"
