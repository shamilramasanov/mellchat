#!/bin/bash

# Скрипт для тестирования авторизации
# Использование: ./test_auth.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="http://localhost:3001/api/v1"
TEST_PHONE="+79001234567"

echo -e "${BLUE}🧪 Тестирование авторизации MellChat${NC}\n"

# Проверка backend
echo -e "${BLUE}1. Проверка backend...${NC}"
if curl -s "$API_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend доступен${NC}"
else
    echo -e "${RED}❌ Backend не доступен на $API_URL${NC}"
    exit 1
fi

# Проверка отправки SMS кода
echo -e "\n${BLUE}2. Тест отправки SMS кода...${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/auth/phone/send-code" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$TEST_PHONE\"}")

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ SMS код отправлен${NC}"
    echo -e "${YELLOW}   Ответ: $RESPONSE${NC}"
else
    echo -e "${RED}❌ Ошибка отправки SMS кода${NC}"
    echo -e "${YELLOW}   Ответ: $RESPONSE${NC}"
fi

# Проверка Redis (код должен быть сохранен)
echo -e "\n${BLUE}3. Проверка Redis...${NC}"
REDIS_KEY="sms_code:${TEST_PHONE}"
REDIS_VALUE=$(redis-cli get "$REDIS_KEY" 2>/dev/null || echo "")

if [ -n "$REDIS_VALUE" ]; then
    echo -e "${GREEN}✅ Код сохранен в Redis${NC}"
    echo -e "${YELLOW}   Данные: ${REDIS_VALUE:0:50}...${NC}"
    
    # Извлекаем код из JSON
    CODE=$(echo "$REDIS_VALUE" | grep -o '"code":"[0-9]*"' | cut -d'"' -f4 || echo "")
    if [ -n "$CODE" ]; then
        echo -e "${YELLOW}   Код: $CODE${NC}\n"
        
        # Тест проверки кода
        echo -e "${BLUE}4. Тест проверки SMS кода...${NC}"
        VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/auth/phone/verify-code" \
          -H "Content-Type: application/json" \
          -d "{\"phone\": \"$TEST_PHONE\", \"code\": \"$CODE\"}")
        
        if echo "$VERIFY_RESPONSE" | grep -q "success.*true"; then
            echo -e "${GREEN}✅ Код подтвержден${NC}"
            
            # Извлекаем токен
            TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || echo "")
            if [ -n "$TOKEN" ]; then
                echo -e "${GREEN}✅ JWT токен получен${NC}\n"
                
                # Проверка /me endpoint
                echo -e "${BLUE}5. Тест получения профиля...${NC}"
                ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
                  -H "Authorization: Bearer $TOKEN")
                
                if echo "$ME_RESPONSE" | grep -q "success.*true"; then
                    echo -e "${GREEN}✅ Профиль получен${NC}"
                    echo -e "${YELLOW}   Ответ: $ME_RESPONSE${NC}"
                else
                    echo -e "${RED}❌ Ошибка получения профиля${NC}"
                    echo -e "${YELLOW}   Ответ: $ME_RESPONSE${NC}"
                fi
            fi
        else
            echo -e "${RED}❌ Ошибка подтверждения кода${NC}"
            echo -e "${YELLOW}   Ответ: $VERIFY_RESPONSE${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ Код не найден в Redis данных${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Код не найден в Redis (возможно уже использован или истек)${NC}"
fi

echo -e "\n${GREEN}✅ Тестирование завершено${NC}"

