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

# 设置备份目录和文件名
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="ai_chat_backup_${TIMESTAMP}"

# 创建备份目录
mkdir -p ${BACKUP_DIR}

echo -e "${GREEN}开始备份生产环境数据...${NC}"

# 备份 MongoDB 数据
echo -e "${GREEN}备份 MongoDB 数据...${NC}"
docker exec ai-chat-mongo-prod mongodump --username ${MONGODB_USERNAME} --password ${MONGODB_PASSWORD} --out /dump
docker cp ai-chat-mongo-prod:/dump ${BACKUP_DIR}/${BACKUP_NAME}_mongo

# 备份环境变量文件
echo -e "${GREEN}备份环境变量文件...${NC}"
cp .env.production ${BACKUP_DIR}/${BACKUP_NAME}_env

# 压缩备份文件
echo -e "${GREEN}压缩备份文件...${NC}"
cd ${BACKUP_DIR}
tar -czf ${BACKUP_NAME}.tar.gz ${BACKUP_NAME}_*
rm -rf ${BACKUP_NAME}_*
cd ..

echo -e "${GREEN}备份完成！${NC}"
echo -e "${GREEN}备份文件位置: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz${NC}" 