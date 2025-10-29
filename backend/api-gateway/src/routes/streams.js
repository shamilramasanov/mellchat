const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Кэш для результатов проверки статуса стримов
const streamStatusCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 секунд

/**
 * Проверка статуса стрима на Twitch
 */
async function checkTwitchStream(channelName) {
  try {
    const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
    const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
    
    if (!TWITCH_CLIENT_ID) {
      logger.warn('Twitch CLIENT_ID not configured, skipping Twitch check');
      return { isLive: false, error: 'Twitch API not configured' };
    }

    // Получаем App Access Token для авторизации (если есть client secret)
    let accessToken = null;
    if (TWITCH_CLIENT_SECRET) {
      try {
        const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: TWITCH_CLIENT_ID,
            client_secret: TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials'
          })
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          accessToken = tokenData.access_token;
        }
      } catch (error) {
        logger.warn('Failed to get Twitch app token:', error.message);
      }
    }

    // Если токена нет, используем только Client-ID (может не работать для новых версий API)
    const headers = {
      'Client-ID': TWITCH_CLIENT_ID
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Получаем user_id канала
    const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(channelName)}`, {
      headers
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      logger.error(`Twitch users API error for ${channelName}:`, { status: userResponse.status, error: errorText });
      return { isLive: false, error: `API error: ${userResponse.status}` };
    }

    const userData = await userResponse.json();
    if (!userData.data || userData.data.length === 0) {
      return { isLive: false, error: 'Channel not found' };
    }

    const userId = userData.data[0].id;

    // Проверяем статус стрима
    const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
      headers
    });

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      logger.error(`Twitch streams API error for ${channelName}:`, { status: streamResponse.status, error: errorText });
      return { isLive: false, error: `API error: ${streamResponse.status}` };
    }

    const streamData = await streamResponse.json();
    const isLive = streamData.data && streamData.data.length > 0;

    if (isLive) {
      const stream = streamData.data[0];
      return {
        isLive: true,
        title: stream.title,
        viewers: stream.viewer_count,
        game: stream.game_name,
        startedAt: stream.started_at
      };
    }

    return { isLive: false };
  } catch (error) {
    logger.error(`Twitch stream check error for ${channelName}:`, error);
    return { isLive: false, error: error.message };
  }
}

/**
 * Проверка статуса стрима на Kick
 */
async function checkKickStream(channelName) {
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(channelName)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return { isLive: false, error: 'Channel not found or API blocked' };
    }

    const data = await response.json();
    const hasLiveStream = data.livestream && data.livestream.id;

    if (hasLiveStream) {
      return {
        isLive: true,
        title: data.livestream.session_title || data.livestream.title,
        viewers: data.livestream.viewer_count || 0,
        startedAt: data.livestream.created_at
      };
    }

    return { isLive: false };
  } catch (error) {
    logger.error(`Kick stream check error for ${channelName}:`, error);
    return { isLive: false, error: error.message };
  }
}

/**
 * GET /api/v1/streams/check/:channelName
 * Проверка статуса стрима на всех платформах
 */
router.get('/check/:channelName', async (req, res) => {
  try {
    const { channelName } = req.params;
    
    if (!channelName) {
      return res.status(400).json({
        success: false,
        error: 'Channel name is required'
      });
    }

    // Проверяем кэш
    const cacheKey = channelName.toLowerCase();
    const cached = streamStatusCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.info(`Using cached stream status for ${channelName}`);
      return res.json({
        success: true,
        platforms: cached.platforms,
        cached: true
      });
    }

    logger.info(`Checking stream status for: ${channelName}`);

    // Проверяем все платформы параллельно
    const [twitchResult, kickResult] = await Promise.all([
      checkTwitchStream(channelName),
      checkKickStream(channelName)
    ]);

    logger.info(`Twitch result for ${channelName}:`, { isLive: twitchResult.isLive, error: twitchResult.error });
    logger.info(`Kick result for ${channelName}:`, { isLive: kickResult.isLive, error: kickResult.error });

    const platforms = {};
    
    // Twitch: показываем только если есть результат (даже если оффлайн)
    if (twitchResult.isLive) {
      platforms.twitch = {
        isLive: true,
        title: twitchResult.title,
        viewers: twitchResult.viewers,
        game: twitchResult.game,
        startedAt: twitchResult.startedAt
      };
    } else if (twitchResult.error) {
      // Показываем только если это не критическая ошибка (канал не найден)
      if (twitchResult.error !== 'Channel not found' && !twitchResult.error.includes('API error')) {
        platforms.twitch = {
          isLive: false,
          error: twitchResult.error
        };
      }
    } else {
      // Канал найден, но стрим не идет
      platforms.twitch = {
        isLive: false
      };
    }

    // Kick: показываем только если есть результат (даже если оффлайн)
    if (kickResult.isLive) {
      platforms.kick = {
        isLive: true,
        title: kickResult.title,
        viewers: kickResult.viewers,
        startedAt: kickResult.startedAt
      };
    } else if (kickResult.error) {
      // Показываем только если это не критическая ошибка
      if (kickResult.error !== 'Channel not found or API blocked') {
        platforms.kick = {
          isLive: false,
          error: kickResult.error
        };
      }
    } else {
      // Канал найден, но стрим не идет
      platforms.kick = {
        isLive: false
      };
    }

    // Сохраняем в кэш
    streamStatusCache.set(cacheKey, {
      platforms,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      platforms,
      cached: false
    });
  } catch (error) {
    logger.error('Stream status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check stream status'
    });
  }
});

module.exports = router;

