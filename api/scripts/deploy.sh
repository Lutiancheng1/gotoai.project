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

echo -e "${GREEN}开始部署生产环境...${NC}"

# 检查并创建环境变量文件
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}未找到.env.production文件，将从.env.prod.example创建${NC}"
    cp .env.prod.example .env.production
    echo -e "${GREEN}已创建.env.production文件${NC}"
    echo -e "${YELLOW}请确保修改.env.production中的敏感信息后再继续${NC}"
    exit 1
fi

# 停止并删除旧的生产环境容器（如果存在）
echo -e "${GREEN}清理旧的生产环境容器...${NC}"
cd docker && docker compose --env-file ../.env.production -p ai-chat-prod -f docker-compose.prod.yml down

# 构建并启动Docker容器
echo -e "${GREEN}构建并启动生产环境容器...${NC}"
docker compose --env-file ../.env.production -p ai-chat-prod -f docker-compose.prod.yml up -d --build

echo -e "${GREEN}生产环境部署完成！${NC}"
echo -e "${GREEN}API服务运行在: http://localhost:3000${NC}"
echo -e "${YELLOW}请确保：${NC}"
echo -e "${YELLOW}1. 已正确配置所有环境变量${NC}"
echo -e "${YELLOW}2. 已配置反向代理（如Nginx）${NC}"
echo -e "${YELLOW}3. 已配置SSL证书${NC}"
echo -e "${YELLOW}4. 已配置防火墙规则${NC}" 