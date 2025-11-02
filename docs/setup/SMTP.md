# Настройка SMTP для отправки email

## 🎯 Быстрый старт (Gmail SMTP)

### Шаг 1: Получите Gmail App Password

1. **Войдите в Google Account:**
   - Перейдите на https://myaccount.google.com
   - Войдите в свой аккаунт

2. **Включите 2-Step Verification (если еще не включен):**
   - Перейдите в **Security** (Безопасность)
   - Найдите **2-Step Verification**
   - Включите его (понадобится телефон)

3. **Создайте App Password:**
   - После включения 2-Step Verification, перейдите в **Security**
   - Найдите **App passwords** (или **Пароли приложений**)
   - Если не видите - попробуйте прямой URL: https://myaccount.google.com/apppasswords
   - Выберите:
     - **Select app**: Mail
     - **Select device**: Other (Custom name) → введите "MellChat Server"
   - Нажмите **Generate**
   - **Скопируйте пароль** (16 символов, пробелы можно игнорировать)

### Шаг 2: Настройте переменные окружения

Откройте файл `.env` в `backend/api-gateway/` и добавьте:

```bash
# Email Configuration
EMAIL_PROVIDER=smtp

# Gmail SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ваш-email@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App Password (16 символов)
SMTP_FROM=MellChat <ваш-email@gmail.com>
```

**Пример:**
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=myemail@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM=MellChat <myemail@gmail.com>
```

### Шаг 3: Перезапустите сервер

```bash
cd backend/api-gateway
npm run dev
```

### Шаг 4: Проверьте логи

При первой отправке email проверьте логи - должна быть строка:
```
SMTP transporter verified
```

Если видите ошибку - проверьте настройки.

---

## 📧 Альтернативные SMTP провайдеры

### Яндекс.Почта

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=ваш-логин@yandex.ru
SMTP_PASSWORD=ваш-пароль
SMTP_FROM=MellChat <ваш-логин@yandex.ru>
```

**Примечание:** Для Яндекс нужен пароль приложения:
- https://id.yandex.ru/security/app-passwords

### Outlook/Hotmail

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ваш-email@outlook.com
SMTP_PASSWORD=ваш-пароль
SMTP_FROM=MellChat <ваш-email@outlook.com>
```

### Собственный SMTP сервер

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=ваш-пароль
SMTP_FROM=MellChat <noreply@yourdomain.com>
```

---

## 🔧 Режим разработки (Mock)

Если не хотите настраивать SMTP сейчас, используйте mock режим:

```bash
EMAIL_PROVIDER=mock
```

В этом режиме коды будут логироваться в консоль бэкенда:
```
[MOCK EMAIL] Код для example@email.com: 123456
```

---

## ⚠️ Troubleshooting

### Ошибка: "SMTP transporter not available"

**Причина:** SMTP не настроен или неверные креденшалы

**Решение:**
1. Проверьте, что все переменные установлены
2. Проверьте, что используете **App Password**, а не обычный пароль Gmail
3. Убедитесь, что 2-Step Verification включен

### Ошибка: "Invalid login"

**Причина:** Неверный пароль или пользователь

**Решение:**
1. Используйте **App Password**, а не обычный пароль
2. Убедитесь, что email указан правильно
3. Для Gmail убедитесь, что "Less secure app access" не нужен (используйте App Password)

### Ошибка: "Connection timeout"

**Причина:** Проблемы с сетью или неправильный порт

**Решение:**
1. Проверьте, что порт правильный (587 для TLS, 465 для SSL)
2. Проверьте, что SMTP_SECURE правильный (false для 587, true для 465)
3. Проверьте firewall/антивирус

---

## 📝 Проверка настройки

После настройки SMTP попробуйте отправить код на email. В логах должно быть:

```
✅ SMTP transporter verified
✅ Email код отправлен на example@email.com
```

Если видите ошибки - проверьте логи и настройки выше.

