#!/bin/bash

# MellChat Quick Backup Script
# Быстрый бекап только критически важных файлов

set -e

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
QUICK_BACKUP="quick_backup_${TIMESTAMP}.tar.gz"

log "Создание быстрого бекапа..."

# Создаем быстрый бекап только важных файлов
tar --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='backups' \
    --exclude='*.log' \
    --exclude='coverage' \
    -czf "$QUICK_BACKUP" \
    src/ \
    backend/ \
    docs/ \
    package*.json \
    *.js \
    *.md \
    *.toml \
    *.json \
    *.sh

log "✅ Быстрый бекап создан: $QUICK_BACKUP"
log "📊 Размер: $(du -sh "$QUICK_BACKUP" | cut -f1)"

# Перемещаем в папку backups
mkdir -p backups
mv "$QUICK_BACKUP" "backups/"
log "📁 Перемещено в: backups/$QUICK_BACKUP"
