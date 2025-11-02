#!/bin/bash

# Скрипт для применения миграций авторизации
# Использование: ./apply_auth_migrations.sh

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Применение миграций авторизации...${NC}"

# Проверка наличия переменных окружения
if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_URL" ]; then
    echo -e "${RED}❌ Ошибка: DATABASE_URL или POSTGRES_URL не установлены${NC}"
    echo "Установите переменную окружения или создайте .env файл"
    exit 1
fi

# Используем DATABASE_URL или POSTGRES_URL
DB_URL=${DATABASE_URL:-$POSTGRES_URL}
DB_URL=${DB_URL:-"postgresql://mellchat:mellchat_password@localhost:5432/mellchat"}

echo "База данных: $DB_URL"

# Список миграций в порядке применения
MIGRATIONS=(
    "database/migrations/add_auth_users.sql"
    "database/migrations/add_user_settings.sql"
    "database/migrations/add_user_spam_rules.sql"
    "database/migrations/add_auth_tables.sql"
)

# Применяем каждую миграцию
for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo -e "${BLUE}📝 Применение: $migration${NC}"
        psql "$DB_URL" -f "$migration" || {
            echo -e "${RED}❌ Ошибка при применении $migration${NC}"
            exit 1
        }
        echo -e "${GREEN}✅ $migration применена${NC}"
    else
        echo -e "${RED}⚠️ Файл не найден: $migration${NC}"
    fi
done

echo -e "${GREEN}✅ Все миграции авторизации применены успешно!${NC}"

