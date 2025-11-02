import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fingerprintPromise = null;
let cachedFingerprint = null;

/**
 * Получить browser fingerprint
 * Кэширует результат для оптимизации
 */
export async function getBrowserFingerprint() {
  // Если уже есть кэшированный результат, возвращаем его
  if (cachedFingerprint) {
    return cachedFingerprint;
  }
  
  // Если уже есть promise, возвращаем его (чтобы не создавать несколько запросов)
  if (fingerprintPromise) {
    return fingerprintPromise;
  }
  
  // Создаем новый promise для генерации fingerprint
  fingerprintPromise = (async () => {
    try {
      // Инициализируем агент
      const fp = await FingerprintJS.load();
      
      // Получаем visitor ID
      const result = await fp.get();
      const fingerprint = result.visitorId;
      
      // Кэшируем результат
      cachedFingerprint = fingerprint;
      
      return fingerprint;
    } catch (error) {
      console.error('Error generating fingerprint:', error);
      // Fallback: генерируем простой fingerprint на основе доступных данных
      return generateFallbackFingerprint();
    }
  })();
  
  return fingerprintPromise;
}

/**
 * Fallback fingerprint если библиотека не работает
 */
function generateFallbackFingerprint() {
  const data = {
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    languages: navigator.languages?.join(',') || '',
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: navigator.deviceMemory || 0,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || ''
  };
  
  // Простой хэш
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `fallback_${Math.abs(hash).toString(36)}`;
}

/**
 * Сбросить кэш fingerprint (для тестирования)
 */
export function resetFingerprintCache() {
  cachedFingerprint = null;
  fingerprintPromise = null;
}

