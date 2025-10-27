#!/bin/bash

# Скрипт для применения оптимизированных индексов
# Использование: ./apply_indexes.sh

echo "🚀 Применяем оптимизированные индексы для MellChat..."

# Проверяем подключение к БД
if ! psql $POSTGRES_URL -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Не удается подключиться к базе данных"
    echo "Проверьте переменную POSTGRES_URL"
    exit 1
fi

echo "✅ Подключение к БД успешно"

# Применяем индексы
echo "📊 Создаем индексы..."

psql $POSTGRES_URL -f database/optimize_indexes.sql

if [ $? -eq 0 ]; then
    echo "✅ Индексы успешно созданы!"
    
    # Показываем статистику
    echo "📈 Статистика индексов:"
    psql $POSTGRES_URL -c "
        SELECT 
            indexname,
            pg_size_pretty(pg_relation_size(indexrelid)) as size,
            idx_scan as scans,
            idx_tup_read as tuples_read,
            idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        WHERE tablename = 'messages'
        ORDER BY pg_relation_size(indexrelid) DESC;
    "
    
    echo "🎉 Оптимизация завершена!"
else
    echo "❌ Ошибка при создании индексов"
    exit 1
fi
