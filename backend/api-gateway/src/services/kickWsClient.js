const WebSocket = require('ws');
const logger = require('../utils/logger');

class KickWsClient {
  constructor({ chatroomId, channelName, onMessage }) {
    this.ws = null;
    this.chatroomId = chatroomId;
    this.channelName = channelName;
    this.onMessage = onMessage;
    this.retries = 0;
    this.maxRetries = 20;
    const appKey = process.env.KICK_PUSHER_APP_KEY || '';
    const cluster = process.env.KICK_PUSHER_CLUSTER || 'us2';
    const explicitUrl = process.env.KICK_WS_URL || '';
    this.baseUrl = explicitUrl || (appKey ? `wss://ws-${cluster}.pusher.com/app/${appKey}?protocol=7&client=js&version=8.4.0-rc2&flash=false` : '');
  }

  connect() {
    if (!this.baseUrl || !this.chatroomId) {
      logger.warn('Kick WS disabled: missing KICK_WS_URL or chatroomId');
      return;
    }
    try {
      const url = this.baseUrl;
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        logger.info('Kick WS connected', { channel: this.channelName, chatroomId: this.chatroomId });
        this.retries = 0;
        // Подписку отправим после pusher:connection_established
      });

      this.ws.on('message', (data) => {
        try {
          const text = data.toString();
          let obj = null;
          try { obj = JSON.parse(text); } catch { obj = null; }
          if (!obj) return;

          // Pusher protocol handling
          if (obj.event === 'pusher:ping') {
            try { this.ws.send(JSON.stringify({ event: 'pusher:pong', data: {} })); } catch {}
            return;
          }
          if (obj.event === 'pusher:error') {
            logger.error('Kick Pusher error', { data: obj.data });
            return;
          }
          if (obj.event === 'pusher:connection_established') {
            logger.debug?.('Kick Pusher established', {});
            // Теперь подписываемся
            const template = process.env.KICK_SUBSCRIBE_TEMPLATE || '';
            if (template) {
              const payloadStr = template.replaceAll('${chatroomId}', String(this.chatroomId));
              try { this.ws.send(payloadStr); } catch {}
            } else {
              const channel = `chatrooms.${this.chatroomId}.v2`;
              const subscribeMsg = { event: 'pusher:subscribe', data: { channel } };
              try { this.ws.send(JSON.stringify(subscribeMsg)); } catch {}
            }
            return;
          }

          // Kick chat events live inside obj.event with JSON string in data
          const event = obj.event || '';
          logger.debug?.('Kick WS event', { event });
          let payload = obj.data;
          if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch {}
          }

          // Known Kick chat message events
          if (event.includes('ChatMessage') || event.includes('MessageCreated') || event.includes('MessageSent')) {
            const m = payload?.message || payload?.msg || payload;
            if (m) {
              const normalized = {
                id: m.id || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                username: m?.sender?.username || m?.user?.username || m?.username || 'user',
                message: m?.content || m?.message || m?.text || '',
                timestamp: new Date(m?.created_at || m?.timestamp || Date.now()).getTime()
              };
              if (normalized.message && this.onMessage) this.onMessage(normalized);
            }
            return;
          }

          // Fallback generic extractor
          const msg = this.extractMessage(obj) || null;
          if (msg && this.onMessage) this.onMessage(msg);
        } catch (e) {
          logger.error('Kick WS message error', { error: e.message });
        }
      });

      this.ws.on('close', (code, reason) => {
        logger.warn('Kick WS closed', { code, reason: reason?.toString?.() });
        this.scheduleReconnect();
      });

      this.ws.on('error', (err) => {
        logger.error('Kick WS error', { error: err.message });
        try { this.ws.close(); } catch {}
      });
    } catch (e) {
      logger.error('Kick WS connect failed', { error: e.message });
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.retries >= this.maxRetries) return;
    const delay = Math.min(30000, 1000 * Math.pow(2, this.retries));
    this.retries += 1;
    setTimeout(() => this.connect(), delay);
  }

  extractMessage(obj) {
    if (!obj) return null;
    // Популярные варианты обёрток сообщений (placeholder): data -> message
    const payload = obj?.data || obj?.message || obj;
    if (!payload) return null;
    // Ожидаемые поля: username/text/timestamp/id — бест-эфорт извлечение
    const username = payload?.sender?.username || payload?.user?.username || payload?.username;
    const text = payload?.content || payload?.message || payload?.text;
    const id = payload?.id || payload?._id || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const ts = payload?.created_at || payload?.timestamp || Date.now();
    if (!username || !text) return null;
    return { id, username, message: text, timestamp: new Date(ts).getTime() };
  }

  close() {
    try { this.ws?.close(1000, 'shutdown'); } catch {}
    this.ws = null;
  }
}

module.exports = KickWsClient;