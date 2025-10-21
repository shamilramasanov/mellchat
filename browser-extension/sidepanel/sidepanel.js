// Side panel script
const API_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

let filterMode = 'all';
let ws = null;
let connectionId = null;
let currentPlatform = null;
const chatContainer = document.getElementById('chatContainer');
const messages = [];

// Connect to stream
document.getElementById('connectBtn').addEventListener('click', async () => {
  const url = document.getElementById('streamUrl').value.trim();
  if (!url) return;
  
  // Parse platform
  let platform, channelName, videoId;
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    platform = 'youtube';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([^&?]+)/);
    videoId = match ? match[1] : '';
  } else if (url.includes('twitch.tv')) {
    platform = 'twitch';
    channelName = url.split('/').pop();
  } else if (url.includes('kick.com')) {
    platform = 'kick';
    channelName = url.split('/').pop();
  }
  
  if (!platform) {
    alert('Unsupported platform');
    return;
  }
  
  try {
    // Connect to backend
    let response;
    if (platform === 'youtube') {
      response = await fetch(`${API_URL}/api/v1/youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      });
    } else if (platform === 'twitch') {
      response = await fetch(`${API_URL}/api/v1/twitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName })
      });
    } else if (platform === 'kick') {
      response = await fetch(`${API_URL}/api/v1/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName })
      });
    }
    
    const data = await response.json();
    if (data.success) {
      connectionId = data.connectionId;
      currentPlatform = platform;
      connectWebSocket();
      document.getElementById('connectBtn').style.display = 'none';
      document.getElementById('disconnectBtn').style.display = 'block';
      chatContainer.innerHTML = '<div class="empty-state"><p>✅ Connected! Waiting for messages...</p></div>';
    } else {
      alert('Connection failed: ' + data.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

// Disconnect
document.getElementById('disconnectBtn').addEventListener('click', async () => {
  if (ws) {
    ws.close();
    ws = null;
  }
  
  if (connectionId) {
    try {
      await fetch(`${API_URL}/api/v1/${currentPlatform}/${connectionId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }
  
  connectionId = null;
  currentPlatform = null;
  messages.length = 0;
  document.getElementById('connectBtn').style.display = 'block';
  document.getElementById('disconnectBtn').style.display = 'none';
  chatContainer.innerHTML = '<div class="empty-state"><p>📺 Disconnected</p></div>';
});

// WebSocket connection
function connectWebSocket() {
  ws = new WebSocket(WS_URL);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    ws.send(JSON.stringify({ type: 'subscribe', connectionId }));
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'message' && data.connectionId === connectionId) {
        const msg = Array.isArray(data.payload) ? data.payload : [data.payload];
        msg.forEach(m => addMessage({
          author: m.username,
          text: m.message,
          isQuestion: m.message?.trim().endsWith('?'),
          platform: currentPlatform
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Filter buttons
document.getElementById('filterQuestions').addEventListener('click', () => {
  filterMode = 'questions';
  updateDisplay();
});

document.getElementById('filterAll').addEventListener('click', () => {
  filterMode = 'all';
  updateDisplay();
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'chat_message') {
    addMessage(request.data);
  }
});

const messages = [];

function addMessage(data) {
  messages.push(data);
  if (messages.length > 100) {
    messages.shift(); // Keep last 100
  }
  updateDisplay();
}

function updateDisplay() {
  // Clear empty state
  chatContainer.innerHTML = '';
  
  const filtered = filterMode === 'questions' 
    ? messages.filter(m => m.isQuestion)
    : messages;
  
  if (filtered.length === 0) {
    chatContainer.innerHTML = `
      <div class="empty-state">
        <p>📭 No ${filterMode === 'questions' ? 'questions' : 'messages'} yet</p>
      </div>
    `;
    return;
  }
  
  filtered.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'chat-message' + (msg.isQuestion ? ' question' : '');
    div.innerHTML = `
      <div class="message-platform">${msg.platform}</div>
      <span class="message-author">${msg.author}</span>
      <span class="message-text">${escapeHtml(msg.text)}</span>
    `;
    chatContainer.appendChild(div);
  });
  
  // Auto-scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Request current page messages on load
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, {type: 'get_messages'});
  }
});

