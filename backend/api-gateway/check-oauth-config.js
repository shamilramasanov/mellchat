#!/usr/bin/env node
/**
 * Скрипт для проверки конфигурации Google OAuth
 */

require('dotenv').config();
const logger = require('./src/utils/logger');

console.log('\n🔍 Проверка конфигурации Google OAuth\n');

const checks = [];
let allPassed = true;

// Проверка 1: GOOGLE_CLIENT_ID
const clientId = process.env.GOOGLE_CLIENT_ID;
if (!clientId) {
  checks.push({ status: '❌', name: 'GOOGLE_CLIENT_ID', message: 'Не установлен' });
  allPassed = false;
} else if (clientId.includes('your_') || clientId.includes('placeholder')) {
  checks.push({ status: '⚠️', name: 'GOOGLE_CLIENT_ID', message: 'Используется плейсхолдер вместо реального значения' });
  allPassed = false;
} else if (!clientId.includes('.apps.googleusercontent.com')) {
  checks.push({ status: '❌', name: 'GOOGLE_CLIENT_ID', message: 'Неверный формат (должен содержать .apps.googleusercontent.com)' });
  allPassed = false;
} else {
  checks.push({ status: '✅', name: 'GOOGLE_CLIENT_ID', message: `Установлен: ${clientId.substring(0, 30)}...` });
}

// Проверка 2: GOOGLE_CLIENT_SECRET
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientSecret) {
  checks.push({ status: '❌', name: 'GOOGLE_CLIENT_SECRET', message: 'Не установлен' });
  allPassed = false;
} else if (clientSecret.includes('your_') || clientSecret.includes('placeholder')) {
  checks.push({ status: '⚠️', name: 'GOOGLE_CLIENT_SECRET', message: 'Используется плейсхолдер вместо реального значения' });
  allPassed = false;
} else if (clientSecret.length < 20) {
  checks.push({ status: '❌', name: 'GOOGLE_CLIENT_SECRET', message: 'Слишком короткий (должен быть минимум 20 символов)' });
  allPassed = false;
} else {
  checks.push({ status: '✅', name: 'GOOGLE_CLIENT_SECRET', message: `Установлен (${clientSecret.length} символов)` });
}

// Проверка 3: GOOGLE_CALLBACK_URL
const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback';
const expectedCallback = 'http://localhost:3001/api/v1/auth/google/callback';
if (callbackUrl === expectedCallback) {
  checks.push({ status: '✅', name: 'GOOGLE_CALLBACK_URL', message: callbackUrl });
} else {
  checks.push({ status: '⚠️', name: 'GOOGLE_CALLBACK_URL', message: `${callbackUrl} (ожидается: ${expectedCallback})` });
}

// Проверка 4: FRONTEND_URL
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const expectedFrontend = 'http://localhost:5173';
if (frontendUrl === expectedFrontend) {
  checks.push({ status: '✅', name: 'FRONTEND_URL', message: frontendUrl });
} else {
  checks.push({ status: '⚠️', name: 'FRONTEND_URL', message: `${frontendUrl} (ожидается: ${expectedFrontend})` });
}

// Вывод результатов
checks.forEach(check => {
  console.log(`${check.status} ${check.name}: ${check.message}`);
});

console.log('\n📋 Рекомендации:\n');

if (!allPassed) {
  console.log('1. Откройте Google Cloud Console: https://console.cloud.google.com/');
  console.log('2. Перейдите в: APIs & Services → Credentials');
  console.log('3. Найдите ваш OAuth 2.0 Client ID');
  console.log('4. Скопируйте Client ID и Client Secret');
  console.log('5. Добавьте в backend/api-gateway/.env:');
  console.log('');
  console.log('   GOOGLE_CLIENT_ID=ваш-client-id.apps.googleusercontent.com');
  console.log('   GOOGLE_CLIENT_SECRET=GOCSPX-ваш-client-secret');
  console.log('');
  console.log('6. В разделе "Authorized redirect URIs" убедитесь, что добавлен:');
  console.log('   http://localhost:3001/api/v1/auth/google/callback');
  console.log('');
  console.log('7. Перейдите в OAuth consent screen и убедитесь, что:');
  console.log('   - Приложение опубликовано или в режиме Testing');
  console.log('   - Ваш email добавлен в Test users (если режим Testing)');
  console.log('');
} else {
  console.log('✅ Все проверки пройдены!');
  console.log('');
  console.log('Если всё ещё возникает ошибка 400:');
  console.log('1. Проверьте логи бэкенда при попытке входа');
  console.log('2. Убедитесь, что callback URL в Google Cloud Console точно совпадает');
  console.log('3. Проверьте, что OAuth consent screen опубликован');
  console.log('');
}

console.log('📝 Логи бэкенда будут содержать детальную информацию об ошибках\n');

process.exit(allPassed ? 0 : 1);

