#!/bin/bash

# Canvas 系统依赖安装脚本
# 用于安装 node-canvas 所需的系统依赖

set -e

echo "🔧 正在检测操作系统..."

# 检测操作系统
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        echo "📦 检测到 Ubuntu/Debian 系统，安装系统依赖..."
        sudo apt update
        sudo apt install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev
        echo "✅ Ubuntu/Debian 系统依赖安装完成"
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        echo "📦 检测到 CentOS/RHEL 系统，安装系统依赖..."
        sudo yum install -y cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel pixman-devel
        echo "✅ CentOS/RHEL 系统依赖安装完成"
    elif command -v dnf &> /dev/null; then
        # Fedora
        echo "📦 检测到 Fedora 系统，安装系统依赖..."
        sudo dnf install -y cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel pixman-devel
        echo "✅ Fedora 系统依赖安装完成"
    else
        echo "❌ 不支持的 Linux 发行版，请手动安装 Canvas 依赖"
        exit 1
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📦 检测到 macOS 系统，安装系统依赖..."
    if command -v brew &> /dev/null; then
        brew install cairo pango libpng jpeg giflib librsvg pixman
        echo "✅ macOS 系统依赖安装完成"
    else
        echo "❌ 请先安装 Homebrew: https://brew.sh/"
        exit 1
    fi
else
    echo "❌ 不支持的操作系统: $OSTYPE"
    exit 1
fi

echo ""
echo "🎉 系统依赖安装完成！现在可以运行 'npm install' 安装 Node.js 依赖了。"