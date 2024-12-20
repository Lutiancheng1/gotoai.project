#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 确保脚本在api目录下运行
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}请在api目录下运行此脚本${NC}"
    exit 1
fi

# 检查是否提供了备份文件
if [ -z "$1" ]; then
    echo -e "${YELLOW}请提供备份文件路径${NC}"
    echo -e "使用方法: npm run restore:prod <backup-file-path>"
    echo -e "示例: npm run restore:prod backups/ai_chat_backup_20231220_120000.tar.gz"
    exit 1
fi

BACKUP_FILE=$1
TEMP_DIR="temp_restore"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}备份文件不存在: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}警告: 还原操作将覆盖当前的数据库和环境配置${NC}"
read -p "是否继续? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}还原操作已取消${NC}"
    exit 1
fi

# 创建临时目录
rm -rf ${TEMP_DIR}
mkdir -p ${TEMP_DIR}

echo -e "${GREEN}解压备份文件...${NC}"
tar -xzf ${BACKUP_FILE} -C ${TEMP_DIR}

# 停止当前运行的服务
echo -e "${GREEN}停止当前运行的服务...${NC}"
npm run docker:stop:prod

# 还原环境变量文件
echo -e "${GREEN}还原环境变量文件...${NC}"
if [ -f "${TEMP_DIR}/"*"_env" ]; then
    cp ${TEMP_DIR}/*_env .env.production
    echo -e "${GREEN}环境变量文件已还原${NC}"
else
    echo -e "${RED}未找到环境变量备份文件${NC}"
    exit 1
fi

# 启动 MongoDB 容器
echo -e "${GREEN}启动 MongoDB 容器...${NC}"
docker-compose --env-file .env.production -p ai-chat-prod -f docker/docker-compose.prod.yml up -d mongo

# 等待 MongoDB 启动
echo -e "${GREEN}等待 MongoDB 启动...${NC}"
sleep 10

# 还原 MongoDB 数据
echo -e "${GREEN}还原 MongoDB 数据...${NC}"
if [ -d "${TEMP_DIR}/"*"_mongo" ]; then
    MONGO_BACKUP_DIR=$(ls -d ${TEMP_DIR}/*_mongo)
    docker cp ${MONGO_BACKUP_DIR}/. ai-chat-mongo-prod:/dump
    docker exec ai-chat-mongo-prod mongorestore --username ${MONGODB_USERNAME} --password ${MONGODB_PASSWORD} --drop /dump
    echo -e "${GREEN}MongoDB 数据已还原${NC}"
else
    echo -e "${RED}未找到 MongoDB 备份文件${NC}"
    exit 1
fi

# 启动其他服务
echo -e "${GREEN}启动其他服务...${NC}"
docker-compose --env-file .env.production -p ai-chat-prod -f docker/docker-compose.prod.yml up -d

# 清理临时���件
echo -e "${GREEN}清理临时文件...${NC}"
rm -rf ${TEMP_DIR}

echo -e "${GREEN}还原完成！${NC}"
echo -e "${GREEN}请检查服务是否正常运行：npm run docker:logs:prod${NC}" 