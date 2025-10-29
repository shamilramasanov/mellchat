#!/bin/bash

# Скрипт для очистки console.log из проекта
# Удаляет отладочные console.log, оставляет только важные

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

# Создаем бекап перед изменениями
log "Создание бекапа перед очисткой..."
./quick-backup.sh

# Функция для очистки console.log из файла
cleanup_file() {
    local file="$1"
    local temp_file="${file}.tmp"
    
    # Удаляем console.log строки, но оставляем console.error и console.warn
    sed -E '/^\s*console\.log\(/d' "$file" > "$temp_file"
    
    # Проверяем, изменился ли файл
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        echo "✅ Очищен: $file"
        return 0
    else
        rm -f "$temp_file"
        return 1
    fi
}

# Очищаем frontend файлы
log "Очистка frontend файлов..."
cleaned_count=0

for file in $(find src -name "*.js" -o -name "*.jsx" | grep -v node_modules); do
    if cleanup_file "$file"; then
        ((cleaned_count++))
    fi
done

# Очищаем backend файлы (только отладочные console.log)
log "Очистка backend файлов..."
for file in $(find backend -name "*.js" | grep -v node_modules); do
    if cleanup_file "$file"; then
        ((cleaned_count++))
    fi
done

log "✅ Очищено файлов: $cleaned_count"

# Показываем оставшиеся console.log
remaining_logs=$(grep -r "console\.log" src backend --include="*.js" --include="*.jsx" | wc -l)
remaining_errors=$(grep -r "console\.error" src backend --include="*.js" --include="*.jsx" | wc -l)
remaining_warns=$(grep -r "console\.warn" src backend --include="*.js" --include="*.jsx" | wc -l)

log "📊 Статистика после очистки:"
log "  - console.log: $remaining_logs (оставлены важные)"
log "  - console.error: $remaining_errors (сохранены)"
log "  - console.warn: $remaining_warns (сохранены)"

# Показываем оставшиеся console.log для проверки
if [ "$remaining_logs" -gt 0 ]; then
    warn "Оставшиеся console.log (проверьте, нужны ли они):"
    grep -r "console\.log" src backend --include="*.js" --include="*.jsx" | head -10
fi

log "🎉 Очистка console.log завершена!"
