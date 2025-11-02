export function normalizeStreamUrl(url) {
  if (!url || typeof url !== 'string') return '';
  
  let normalized = url.trim();
  
  // Добавляем https:// если нет протокола
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  
  return normalized;
}

export function detectPlatform(url) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('kick.com')) return 'kick';
  return 'twitch';
}

export function extractChannelName(url) {
  if (!url || typeof url !== 'string') return 'Unknown';
  
  // Добавляем https:// если нет протокола
  let urlToCheck = url.trim();
  if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
    urlToCheck = 'https://' + urlToCheck;
  }
  
  try {
    const urlObj = new URL(urlToCheck);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      if (url.includes('youtube')) {
        if (segments[0] === 'channel' || segments[0] === 'c') return segments[1] || 'YouTubeStreamer';
        if (segments[0].startsWith('@')) return segments[0].substring(1);
      }
      return segments[0];
    }
  } catch {}
  return 'Unknown';
}

export function isValidStreamUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Добавляем https:// если нет протокола
  let urlToCheck = url.trim();
  if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
    urlToCheck = 'https://' + urlToCheck;
  }
  
  try {
    const u = new URL(urlToCheck);
    const h = u.hostname.toLowerCase();
    return (
      h.includes('twitch.tv') ||
      h.includes('youtube.com') ||
      h.includes('youtu.be') ||
      h.includes('kick.com')
    );
  } catch {
    return false;
  }
}


