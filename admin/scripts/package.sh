#!/bin/bash

# 确保脚本在错误时退出
set -e

# 运行构建命令
echo "开始构建 admin 项目..."
npm run build

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "构建成功，开始打包..."
    
    # 获取当前时间戳
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    
    # 创建压缩包名称
    ARCHIVE_NAME="Knowledge_admin_${TIMESTAMP}.tar.gz"
    
    # 进入项目根目录
    cd "$(dirname "$0")/.."
    
    # 压缩 dist 目录
    tar -czf "${ARCHIVE_NAME}" dist/
    
    echo "打包完成: ${ARCHIVE_NAME}"
    
    # 可选：移动压缩包到指定目录
    # mkdir -p archives
    # mv "${ARCHIVE_NAME}" archives/
    
    echo "✨ 全部完成!"
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi 