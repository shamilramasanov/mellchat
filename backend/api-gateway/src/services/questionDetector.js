// backend/api-gateway/src/services/questionDetector.js
const QUESTION_STARTS = [
  "кто","что","где","зачем","почему","когда","как","можно","есть ли","не думаешь ли",
  "who","what","where","why","when","how","can","is","are"
];

const QUESTION_PATTERNS = [
  /можно ли/i,
  /как (?:мне|ты|он|она|мы|это)/i,
  /что если/i,
  /почему/i,
  /зачем/i,
  /где находится/i,
  /не знаешь ли/i,
  /\b(is it|can i|how to|what if|why)\b/i
];

// Эмодзи-вопросы
const QUESTION_EMOJIS = ['🤔', '❓', '⁉️', '❔'];

function looksLikeLink(text) {
  return /https?:\/\/|www\.|\.com|\.ru|\.net/.test(text);
}

function isQuestion(text, lastMessages = []) {
  if (!text || typeof text !== 'string') return false;
  const raw = text.trim();
  
  // Слишком короткие или длинные сообщения
  if (raw.length < 3 || raw.length > 500) return false;
  
  // Ссылки — исключаем
  if (looksLikeLink(raw)) return false;

  const low = raw.toLowerCase();

  // 1) Прямой старт вопросительного слова
  if (QUESTION_STARTS.some(w => low.startsWith(w + ' ') || low === w)) return true;

  // 2) Шаблоны
  if (QUESTION_PATTERNS.some(rx => rx.test(raw))) return true;

  // 3) Эмодзи-вопросы
  if (QUESTION_EMOJIS.some(emoji => raw.includes(emoji))) return true;

  // 4) Короткий уточняющий вопрос: если предыдущие сообщения от того же пользователя длинные
  if (/(?:\bа\b|\bто\b|\bа как\b|\bеще\b|\bгде\b|\bкак\b)/i.test(raw) && lastMessages.length) {
    // Если есть контекст — считаем вопросом
    const prev = lastMessages[lastMessages.length - 1];
    if (prev && prev.content && prev.content.length > 20) return true;
  }

  // 5) Наконец — знак вопроса в конце (если всё остальное не спам)
  if (raw.endsWith('?')) return true;

  return false;
}

// Функция для получения последних сообщений пользователя (из Redis или памяти)
async function getLastMessagesForUser(userId, limit = 5) {
  // TODO: Реализовать получение из Redis
  // Пока возвращаем пустой массив
  return [];
}

// Основная функция для обработки сообщения
async function detectQuestion(message) {
  try {
    const { content, userId } = message;
    
    // Получаем последние сообщения пользователя
    const lastMessages = await getLastMessagesForUser(userId, 5);
    
    // Определяем, является ли сообщение вопросом
    const isQuestionResult = isQuestion(content, lastMessages);
    
    return {
      ...message,
      isQuestion: isQuestionResult
    };
  } catch (error) {
    console.error('Error detecting question:', error);
    return {
      ...message,
      isQuestion: false
    };
  }
}

module.exports = {
  isQuestion,
  detectQuestion,
  getLastMessagesForUser
};
