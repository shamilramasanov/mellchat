#!/bin/bash

# Скрипт для создания бэкапа проекта MellChat
# Использование: ./backup.sh

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Переходим в директорию проекта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"
BACKUP_DIR="$SCRIPT_DIR/../"

# Имя архива с датой и временем
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="MellChat_backup_${TIMESTAMP}.tar.gz"
BACKUP_PATH="${BACKUP_DIR}${BACKUP_NAME}"

echo -e "${BLUE}📦 Создание бэкапа MellChat...${NC}"
echo "Проект: $PROJECT_DIR"
echo "Бэкап: $BACKUP_PATH"

# Создаем архив, исключая ненужные файлы
# ВАЖНО: .env файлы ВКЛЮЧЕНЫ в бэкап для удобства восстановления
tar --exclude='node_modules' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='*.tar.gz' \
    --exclude='*.zip' \
    --exclude='.DS_Store' \
    --exclude='coverage' \
    --exclude='.cache' \
    --exclude='backend/api-gateway/logs' \
    --exclude='*.swp' \
    --exclude='*.swo' \
    --exclude='.idea' \
    --exclude='.vscode' \
    -czf "$BACKUP_PATH" \
    -C "$BACKUP_DIR" \
    MellChat/

if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    echo -e "${GREEN}✅ Бэкап создан успешно!${NC}"
    echo "   Файл: $BACKUP_NAME"
    echo "   Размер: $SIZE"
    echo "   Путь: $BACKUP_PATH"
else
    echo "❌ Ошибка при создании бэкапа"
    exit 1
fi

