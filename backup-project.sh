#!/bin/bash

# MellChat Project Backup Script
# Создает полный бекап проекта включая БД, код и конфигурации

set -e  # Остановить при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
PROJECT_NAME="MellChat"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${PROJECT_NAME}_backup_${TIMESTAMP}"
FULL_BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Функция логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    # Проверяем наличие необходимых команд
    for cmd in git pg_dump tar gzip; do
        if ! command -v $cmd &> /dev/null; then
            error "Команда $cmd не найдена. Установите её для продолжения."
            exit 1
        fi
    done
    
    log "✅ Все зависимости найдены"
}

# Создание директории для бекапа
create_backup_dir() {
    log "Создание директории для бекапа..."
    mkdir -p "$FULL_BACKUP_PATH"
    log "✅ Директория создана: $FULL_BACKUP_PATH"
}

# Бекап исходного кода
backup_source_code() {
    log "Создание бекапа исходного кода..."
    
    # Исключаем ненужные файлы
    tar --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.git' \
        --exclude='backups' \
        --exclude='*.log' \
        --exclude='.env' \
        --exclude='.env.local' \
        --exclude='*.tmp' \
        --exclude='coverage' \
        --exclude='.nyc_output' \
        -czf "${FULL_BACKUP_PATH}/source_code.tar.gz" .
    
    log "✅ Исходный код сохранен в source_code.tar.gz"
}

# Бекап базы данных
backup_database() {
    log "Создание бекапа базы данных..."
    
    # Проверяем переменные окружения для БД
    if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_URL" ]; then
        warn "Переменные DATABASE_URL или POSTGRES_URL не найдены"
        warn "Попытка подключения к локальной БД..."
        
        # Пробуем подключиться к локальной БД
        if pg_dump -h localhost -U postgres -d mellchat > "${FULL_BACKUP_PATH}/database.sql" 2>/dev/null; then
            log "✅ База данных сохранена из локального подключения"
        else
            warn "Не удалось подключиться к базе данных. Пропускаем бекап БД."
        fi
    else
        # Используем переменную окружения
        DB_URL=${DATABASE_URL:-$POSTGRES_URL}
        pg_dump "$DB_URL" > "${FULL_BACKUP_PATH}/database.sql"
        log "✅ База данных сохранена из переменной окружения"
    fi
}

# Бекап конфигурационных файлов
backup_configs() {
    log "Создание бекапа конфигураций..."
    
    # Создаем директорию для конфигов
    mkdir -p "${FULL_BACKUP_PATH}/configs"
    
    # Копируем важные конфигурационные файлы
    cp -r backend/api-gateway/database/migrations "${FULL_BACKUP_PATH}/configs/" 2>/dev/null || true
    cp backend/api-gateway/database/schema.sql "${FULL_BACKUP_PATH}/configs/" 2>/dev/null || true
    cp backend/api-gateway/env.example "${FULL_BACKUP_PATH}/configs/" 2>/dev/null || true
    cp package.json "${FULL_BACKUP_PATH}/configs/" 2>/dev/null || true
    cp frontend/pwa/package.json "${FULL_BACKUP_PATH}/configs/frontend_package.json" 2>/dev/null || true
    cp backend/api-gateway/package.json "${FULL_BACKUP_PATH}/configs/backend_package.json" 2>/dev/null || true
    cp vite.config.js "${FULL_BACKUP_PATH}/configs/" 2>/dev/null || true
    cp vercel.json "${FULL_BACKUP_PATH}/configs/" 2>/dev/null || true
    cp railway.toml "${FULL_BACKUP_PATH}/configs/" 2>/dev/null || true
    
    # Копируем скрипты
    cp *.sh "${FULL_BACKUP_PATH}/configs/" 2>/dev/null || true
    
    log "✅ Конфигурационные файлы сохранены"
}

# Бекап документации
backup_docs() {
    log "Создание бекапа документации..."
    
    if [ -d "docs" ]; then
        cp -r docs "${FULL_BACKUP_PATH}/"
        log "✅ Документация сохранена"
    else
        warn "Папка docs не найдена"
    fi
}

# Создание информации о системе
create_system_info() {
    log "Создание информации о системе..."
    
    cat > "${FULL_BACKUP_PATH}/system_info.txt" << EOF
MellChat Project Backup
======================

Дата создания: $(date)
Версия проекта: $(grep '"version"' package.json | cut -d'"' -f4)
Node.js версия: $(node --version 2>/dev/null || echo "Не установлен")
NPM версия: $(npm --version 2>/dev/null || echo "Не установлен")
Git версия: $(git --version 2>/dev/null || echo "Не установлен")

Структура проекта:
$(find . -type f -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.sql" | head -20)

Размер проекта: $(du -sh . | cut -f1)

Переменные окружения:
DATABASE_URL: ${DATABASE_URL:+SET}
POSTGRES_URL: ${POSTGRES_URL:+SET}
REDIS_URL: ${REDIS_URL:+SET}
NODE_ENV: ${NODE_ENV:-not set}

EOF

    log "✅ Информация о системе сохранена"
}

# Создание скрипта восстановления
create_restore_script() {
    log "Создание скрипта восстановления..."
    
    cat > "${FULL_BACKUP_PATH}/restore.sh" << 'EOF'
#!/bin/bash

# MellChat Project Restore Script
# Восстанавливает проект из бекапа

set -e

echo "🔄 Восстановление проекта MellChat..."

# Проверка аргументов
if [ $# -eq 0 ]; then
    echo "Использование: $0 <путь_к_бекапу>"
    echo "Пример: $0 ./backups/MellChat_backup_20241229_143022"
    exit 1
fi

BACKUP_PATH="$1"

if [ ! -d "$BACKUP_PATH" ]; then
    echo "❌ Директория бекапа не найдена: $BACKUP_PATH"
    exit 1
fi

echo "📁 Восстановление из: $BACKUP_PATH"

# Восстановление исходного кода
if [ -f "$BACKUP_PATH/source_code.tar.gz" ]; then
    echo "📦 Восстановление исходного кода..."
    tar -xzf "$BACKUP_PATH/source_code.tar.gz"
    echo "✅ Исходный код восстановлен"
fi

# Восстановление базы данных
if [ -f "$BACKUP_PATH/database.sql" ]; then
    echo "🗄️ Восстановление базы данных..."
    echo "⚠️  Внимание: Убедитесь, что база данных доступна!"
    echo "Для восстановления БД выполните:"
    echo "psql < $BACKUP_PATH/database.sql"
fi

# Восстановление конфигураций
if [ -d "$BACKUP_PATH/configs" ]; then
    echo "⚙️ Восстановление конфигураций..."
    cp -r "$BACKUP_PATH/configs"/* ./
    echo "✅ Конфигурации восстановлены"
fi

echo "🎉 Восстановление завершено!"
echo "📋 Следующие шаги:"
echo "1. Установите зависимости: npm install"
echo "2. Настройте переменные окружения"
echo "3. Восстановите базу данных (если нужно)"
echo "4. Запустите проект: npm run dev"
EOF

    chmod +x "${FULL_BACKUP_PATH}/restore.sh"
    log "✅ Скрипт восстановления создан"
}

# Создание архива
create_final_archive() {
    log "Создание финального архива..."
    
    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    
    # Удаляем временную директорию
    rm -rf "$BACKUP_NAME"
    
    # Показываем размер архива
    ARCHIVE_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
    log "✅ Финальный архив создан: ${BACKUP_NAME}.tar.gz (${ARCHIVE_SIZE})"
    
    cd - > /dev/null
}

# Очистка старых бекапов
cleanup_old_backups() {
    log "Очистка старых бекапов (старше 7 дней)..."
    
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true
    log "✅ Старые бекапы очищены"
}

# Основная функция
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "    MellChat Project Backup Script"
    echo "=========================================="
    echo -e "${NC}"
    
    log "Начало создания бекапа проекта $PROJECT_NAME"
    
    check_dependencies
    create_backup_dir
    backup_source_code
    backup_database
    backup_configs
    backup_docs
    create_system_info
    create_restore_script
    create_final_archive
    cleanup_old_backups
    
    echo -e "${GREEN}"
    echo "=========================================="
    echo "    Бекап успешно создан!"
    echo "=========================================="
    echo -e "${NC}"
    
    log "📁 Путь к бекапу: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    log "📋 Для восстановления используйте: ./restore.sh ${BACKUP_DIR}/${BACKUP_NAME}"
    
    # Показываем содержимое бекапа
    echo -e "${BLUE}Содержимое бекапа:${NC}"
    tar -tzf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | head -20
    echo "..."
}

# Запуск
main "$@"
