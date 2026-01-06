#!/bin/bash

# 测试工程师后端服务启动脚本
# 用途：快速启动后端服务并进行健康检查

set -e

echo "=========================================="
echo "  VCU模糊测试系统 - 测试工程师后端"
echo "=========================================="
echo ""

# 切换到backend目录
cd "$(dirname "$0")"

# 检查Python版本
echo "检查Python版本..."
python3 --version

# 检查依赖
echo "检查依赖..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "❌ 缺少FastAPI依赖，正在安装..."
    pip3 install -r requirements.txt
fi

# 创建必要的目录
echo "创建数据目录..."
mkdir -p data/test_plans
mkdir -p data/reports
mkdir -p model_weights/vcu

# 检查数据库
if [ -f "data/test_system.db" ]; then
    echo "✓ 数据库文件已存在"
else
    echo "⚠️  数据库文件不存在，首次运行将自动创建"
fi

# 初始化演示数据（在启动服务器之前）
echo ""
echo "=========================================="
echo "  初始化演示数据..."
echo "=========================================="
echo ""
if [ -f "init_demo_data.py" ]; then
    echo "运行 init_demo_data.py..."
    python3 init_demo_data.py
    echo "✓ 演示数据初始化完成"
else
    echo "⚠️  init_demo_data.py 文件不存在，跳过数据初始化"
fi

# 启动服务
echo ""
echo "=========================================="
echo "  启动后端服务..."
echo "=========================================="
echo ""
echo "API服务: http://localhost:8000"
echo "API文档: http://localhost:8000/docs"
echo "WebSocket: ws://localhost:8000/ws/test-tasks/{task_id}"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 启动uvicorn
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
