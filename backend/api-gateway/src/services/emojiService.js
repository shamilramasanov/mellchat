const axios = require('axios');
const logger = require('../utils/logger');
const redisService = require('./redisService');

class EmojiService {
  constructor() {
    this.cache = new Map(); // In-memory cache
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    
    // Twitch custom emoji APIs
    this.bttvApi = 'https://api.betterttv.net/3/cached/emotes/global';
    this.ffzApi = 'https://api.frankerfacez.com/v1/set/global';
    this.seventvApi = 'https://api.7tv.app/v2/emotes/global';
    
    // Initialize Twitch emoji cache
    this.initializeTwitchEmojis();
  }

  // Initialize Twitch custom emojis
  async initializeTwitchEmojis() {
    try {
      await Promise.all([
        this.loadBTTVEmojis(),
        this.loadFFZEmojis(),
        this.load7TVEmojis()
      ]);
      logger.info('Twitch custom emojis initialized');
    } catch (error) {
      logger.error('Failed to initialize Twitch emojis:', error);
    }
  }

  // Load BTTV global emojis
  async loadBTTVEmojis() {
    try {
      // Check Redis cache first
      const cached = await redisService.get('emoji:bttv:global');
      if (cached) {
        const emojis = JSON.parse(cached);
        emojis.forEach(emoji => {
          this.cache.set(`bttv:${emoji.code}`, {
            type: 'bttv',
            id: emoji.id,
            name: emoji.code,
            url: `https://cdn.betterttv.net/emote/${emoji.id}/1x`,
            animated: emoji.animated || false
          });
        });
        logger.info(`Loaded ${emojis.length} BTTV emojis from cache`);
        return;
      }

      const response = await axios.get(this.bttvApi);
      const emojis = response.data || [];
      
      // Cache in Redis for 24 hours
      await redisService.setex('emoji:bttv:global', 24 * 60 * 60, JSON.stringify(emojis));
      
      emojis.forEach(emoji => {
        this.cache.set(`bttv:${emoji.code}`, {
          type: 'bttv',
          id: emoji.id,
          name: emoji.code,
          url: `https://cdn.betterttv.net/emote/${emoji.id}/1x`,
          animated: emoji.animated || false
        });
      });
      
      logger.info(`Loaded ${emojis.length} BTTV emojis from API`);
    } catch (error) {
      logger.error('Failed to load BTTV emojis:', error);
    }
  }

  // Load FFZ global emojis
  async loadFFZEmojis() {
    try {
      // Check Redis cache first
      const cached = await redisService.get('emoji:ffz:global');
      if (cached) {
        const data = JSON.parse(cached);
        const sets = data.sets || {};
        
        Object.values(sets).forEach(set => {
          set.emoticons?.forEach(emoji => {
            this.cache.set(`ffz:${emoji.name}`, {
              type: 'ffz',
              id: emoji.id,
              name: emoji.name,
              url: `https:${emoji.urls['1']}`,
              animated: false
            });
          });
        });
        logger.info(`Loaded FFZ emojis from cache`);
        return;
      }

      const response = await axios.get(this.ffzApi);
      const data = response.data;
      
      // Cache in Redis for 24 hours
      await redisService.setex('emoji:ffz:global', 24 * 60 * 60, JSON.stringify(data));
      
      const sets = data.sets || {};
      
      Object.values(sets).forEach(set => {
        set.emoticons?.forEach(emoji => {
          this.cache.set(`ffz:${emoji.name}`, {
            type: 'ffz',
            id: emoji.id,
            name: emoji.name,
            url: `https:${emoji.urls['1']}`,
            animated: false
          });
        });
      });
      
      logger.info(`Loaded FFZ emojis from API`);
    } catch (error) {
      logger.error('Failed to load FFZ emojis:', error);
    }
  }

  // Load 7TV global emojis
  async load7TVEmojis() {
    try {
      // Check Redis cache first
      const cached = await redisService.get('emoji:7tv:global');
      if (cached) {
        const emojis = JSON.parse(cached);
        emojis.forEach(emoji => {
          this.cache.set(`7tv:${emoji.name}`, {
            type: '7tv',
            id: emoji.id,
            name: emoji.name,
            url: `https://cdn.7tv.app/emote/${emoji.id}/1x.webp`,
            animated: emoji.animated || false
          });
        });
        logger.info(`Loaded ${emojis.length} 7TV emojis from cache`);
        return;
      }

      const response = await axios.get(this.seventvApi);
      const emojis = response.data || [];
      
      // Cache in Redis for 24 hours
      await redisService.setex('emoji:7tv:global', 24 * 60 * 60, JSON.stringify(emojis));
      
      emojis.forEach(emoji => {
        this.cache.set(`7tv:${emoji.name}`, {
          type: '7tv',
          id: emoji.id,
          name: emoji.name,
          url: `https://cdn.7tv.app/emote/${emoji.id}/1x.webp`,
          animated: emoji.animated || false
        });
      });
      
      logger.info(`Loaded ${emojis.length} 7TV emojis from API`);
    } catch (error) {
      logger.error('Failed to load 7TV emojis:', error);
    }
  }

  // Parse emojis from message text
  async parseEmojis(text, platform = 'universal') {
    const emojis = [];
    
    // 1. Parse Unicode emojis
    const unicodeEmojis = this.parseUnicodeEmojis(text);
    emojis.push(...unicodeEmojis);
    
    // 2. Parse platform-specific custom emojis
    if (platform === 'twitch') {
      const twitchEmojis = await this.parseTwitchEmojis(text);
      emojis.push(...twitchEmojis);
    } else if (platform === 'youtube') {
      const youtubeEmojis = await this.parseYouTubeEmojis(text);
      emojis.push(...youtubeEmojis);
    } else if (platform === 'kick') {
      const kickEmojis = await this.parseKickEmojis(text);
      emojis.push(...kickEmojis);
    }
    
    return emojis;
  }

  // Parse Unicode emojis
  parseUnicodeEmojis(text) {
    const emojis = [];
    const unicodeRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    
    let match;
    while ((match = unicodeRegex.exec(text)) !== null) {
      emojis.push({
        type: 'unicode',
        id: match[0],
        name: this.getUnicodeEmojiName(match[0]),
        url: null, // Unicode emojis are rendered by browser
        animated: false,
        position: match.index,
        length: match[0].length
      });
    }
    
    return emojis;
  }

  // Parse Twitch custom emojis (:emotename:)
  async parseTwitchEmojis(text) {
    const emojis = [];
    const twitchRegex = /:([a-zA-Z0-9_]+):/g;
    
    let match;
    while ((match = twitchRegex.exec(text)) !== null) {
      const emojiName = match[1];
      
      // Check cache for custom emoji
      const bttvEmoji = this.cache.get(`bttv:${emojiName}`);
      const ffzEmoji = this.cache.get(`ffz:${emojiName}`);
      const seventvEmoji = this.cache.get(`7tv:${emojiName}`);
      
      const customEmoji = bttvEmoji || ffzEmoji || seventvEmoji;
      
      if (customEmoji) {
        emojis.push({
          ...customEmoji,
          position: match.index,
          length: match[0].length
        });
      }
    }
    
    return emojis;
  }

  // Parse YouTube emojis (from Live Chat API)
  async parseYouTubeEmojis(text) {
    // YouTube Live Chat API provides emoji metadata
    // This would be implemented based on actual API response structure
    const emojis = [];
    
    // Placeholder for YouTube emoji parsing
    // In real implementation, this would parse emoji data from YouTube API
    
    return emojis;
  }

  // Parse Kick emojis
  async parseKickEmojis(text) {
    // Kick emojis are provided in Pusher message data
    const emojis = [];
    
    // Placeholder for Kick emoji parsing
    // In real implementation, this would parse emoji data from Kick Pusher
    
    return emojis;
  }

  // Get Unicode emoji name (simplified)
  getUnicodeEmojiName(emoji) {
    const emojiNames = {
      '😀': 'grinning',
      '😃': 'smiley',
      '😄': 'smile',
      '😁': 'grin',
      '😆': 'laughing',
      '😅': 'sweat_smile',
      '🤣': 'rofl',
      '😂': 'joy',
      '🙂': 'slightly_smiling',
      '🙃': 'upside_down',
      '😉': 'wink',
      '😊': 'blush',
      '😇': 'innocent',
      '🥰': 'smiling_hearts',
      '😍': 'heart_eyes',
      '🤩': 'star_struck',
      '😘': 'kissing_heart',
      '😗': 'kissing',
      '😚': 'kissing_closed_eyes',
      '😙': 'kissing_smiling_eyes',
      '😋': 'yum',
      '😛': 'stuck_out_tongue',
      '😜': 'stuck_out_tongue_winking_eye',
      '🤪': 'zany',
      '😝': 'stuck_out_tongue_closed_eyes',
      '🤑': 'money_mouth',
      '🤗': 'hugs',
      '🤭': 'hand_over_mouth',
      '🤫': 'shushing',
      '🤔': 'thinking',
      '🤐': 'zipper_mouth',
      '🤨': 'raised_eyebrow',
      '😐': 'neutral',
      '😑': 'expressionless',
      '😶': 'no_mouth',
      '😏': 'smirk',
      '😒': 'unamused',
      '🙄': 'roll_eyes',
      '😬': 'grimacing',
      '🤥': 'lying',
      '😌': 'relieved',
      '😔': 'pensive',
      '😪': 'sleepy',
      '🤤': 'drooling',
      '😴': 'sleeping',
      '😷': 'mask',
      '🤒': 'face_with_thermometer',
      '🤕': 'face_with_head_bandage',
      '🤢': 'nauseated',
      '🤮': 'vomiting',
      '🤧': 'sneezing',
      '🥵': 'hot',
      '🥶': 'cold',
      '🥴': 'woozy',
      '😵': 'dizzy',
      '🤯': 'exploding_head',
      '🤠': 'cowboy',
      '🥳': 'partying',
      '😎': 'sunglasses',
      '🤓': 'nerd',
      '🧐': 'monocle',
      '😕': 'confused',
      '😟': 'worried',
      '🙁': 'slightly_frowning',
      '😮': 'open_mouth',
      '😯': 'hushed',
      '😲': 'astonished',
      '😳': 'flushed',
      '🥺': 'pleading',
      '😦': 'frowning',
      '😧': 'anguished',
      '😨': 'fearful',
      '😰': 'cold_sweat',
      '😥': 'disappointed_relieved',
      '😢': 'cry',
      '😭': 'sob',
      '😱': 'scream',
      '😖': 'confounded',
      '😣': 'persevere',
      '😞': 'disappointed',
      '😓': 'sweat',
      '😩': 'weary',
      '😫': 'tired_face',
      '🥱': 'yawning',
      '😤': 'triumph',
      '😡': 'rage',
      '😠': 'angry',
      '🤬': 'cursing',
      '😈': 'smiling_imp',
      '👿': 'imp',
      '💀': 'skull',
      '☠️': 'skull_crossbones',
      '💩': 'hankey',
      '🤡': 'clown',
      '👹': 'japanese_ogre',
      '👺': 'japanese_goblin',
      '👻': 'ghost',
      '👽': 'alien',
      '👾': 'space_invader',
      '🤖': 'robot',
      '😺': 'smiley_cat',
      '😸': 'smile_cat',
      '😹': 'joy_cat',
      '😻': 'heart_eyes_cat',
      '😼': 'smirk_cat',
      '😽': 'kissing_cat',
      '🙀': 'scream_cat',
      '😿': 'crying_cat',
      '😾': 'pouting_cat'
    };
    
    return emojiNames[emoji] || 'unknown';
  }

  // Process message and replace emojis with HTML
  async processMessage(message, platform = 'universal') {
    const { text } = message;
    const emojis = await this.parseEmojis(text, platform);
    
    let processedText = text;
    let offset = 0;
    
    // Sort emojis by position (descending) to avoid position shifts
    emojis.sort((a, b) => b.position - a.position);
    
    emojis.forEach(emoji => {
      const start = emoji.position + offset;
      const end = start + emoji.length;
      
      let replacement = '';
      
      if (emoji.type === 'unicode') {
        // Unicode emojis are rendered by browser
        replacement = emoji.id;
      } else {
        // Custom emojis need img tags
        replacement = `<img src="${emoji.url}" alt="${emoji.name}" class="emoji emoji-${emoji.type}" title="${emoji.name}" />`;
      }
      
      processedText = processedText.substring(0, start) + replacement + processedText.substring(end);
    });
    
    return {
      ...message,
      text: processedText,
      emojis: emojis
    };
  }

  // Get emoji statistics
  getStats() {
    return {
      totalCached: this.cache.size,
      bttvCount: Array.from(this.cache.keys()).filter(k => k.startsWith('bttv:')).length,
      ffzCount: Array.from(this.cache.keys()).filter(k => k.startsWith('ffz:')).length,
      seventvCount: Array.from(this.cache.keys()).filter(k => k.startsWith('7tv:')).length
    };
  }
}

module.exports = new EmojiService();
