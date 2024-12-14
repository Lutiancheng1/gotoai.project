#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 确保脚本在api目录下运行
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}请在api目录下运行此脚本${NC}"
    exit 1
fi

echo -e "${GREEN}开始设置开发环境...${NC}"

# 检查并创建环境变量文件
if [ ! -f ".env.development" ]; then
    echo -e "${YELLOW}未找到.env.development文件，将从.env.dev.example创建${NC}"
    cp .env.dev.example .env.development
    echo -e "${GREEN}已创建.env.development文件${NC}"
fi

# 安装依赖
echo -e "${GREEN}安装Node.js依赖...${NC}"
npm install

# 停止并删除旧的开发环境容器（如果存在）
echo -e "${GREEN}清理旧的开发环境容器...${NC}"
cd docker && docker compose --env-file ../.env.development -p ai-chat-dev -f docker-compose.dev.yml down

# 启动Docker容器
echo -e "${GREEN}启动Docker容器...${NC}"
docker compose --env-file ../.env.development -p ai-chat-dev -f docker-compose.dev.yml up 

echo -e "${GREEN}开发环境设置完成！${NC}"
echo -e "${GREEN}API服务运行在: http://localhost:3000${NC}"
echo -e "${GREEN}Mongo Express运行在: http://localhost:8081${NC}"
echo -e "${YELLOW}请确保修改了.env.development中的敏感信息（密码、密钥等）${NC}" 