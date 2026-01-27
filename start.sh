#!/bin/bash

# ArkUI Support Matrix - 启动脚本

echo "🚀 ArkUI 组件属性支持度大盘 - 启动脚本"
echo "=========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

if [ ! -d "src/frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd src/frontend && npm install && cd ../..
fi

# 检查数据文件
if [ ! -f "data/component_support_matrix.json" ]; then
    echo ""
    echo "⚠️  未找到数据文件，是否现在运行扫描？"
    echo "   运行 npm run scan 可以生成初始数据"
    echo ""
fi

echo ""
echo "🎯 选择启动模式:"
echo "   1) 开发模式 (前端+后端热重载)"
echo "   2) 仅启动后端服务"
echo "   3) 仅启动前端服务"
echo "   4) 运行数据扫描"
echo ""
read -p "请选择 [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 启动开发服务器..."
        npm run dev
        ;;
    2)
        echo ""
        echo "🚀 启动后端服务 (http://localhost:3001)..."
        npm run server:dev
        ;;
    3)
        echo ""
        echo "🚀 启动前端服务 (http://localhost:3000)..."
        npm run frontend:dev
        ;;
    4)
        echo ""
        echo "🔍 开始扫描..."
        npm run scan
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac
