// Side panel script - Multiple streams support
const API_URL = 'https://mellchat-production.up.railway.app';
const WS_URL = 'wss://mellchat-production.up.railway.app';

let filterMode = 'all';
let ws = null;
let streams = []; // Array of connected streams
let activeStreamId = null;
let allMessages = [];

// DOM elements
const streamsList = document.getElementById('streamsList');
const chatContainer = document.getElementById('chatContainer');
const addStreamBtn = document.getElementById('addStreamBtn');
const addStreamForm = document.getElementById('addStreamForm');
const streamUrlInput = document.getElementById('streamUrl');
const connectBtn = document.getElementById('connectBtn');
const cancelBtn = document.getElementById('cancelBtn');
const filterAllBtn = document.getElementById('filterAll');
const filterQuestionsBtn = document.getElementById('filterQuestions');

// Auto-detect current tab URL on load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = tab.url;
      if (url.includes('youtube.com') || url.includes('twitch.tv') || url.includes('kick.com')) {
        streamUrlInput.value = url;
      }
    }
  } catch (error) {
    console.log('Could not auto-detect URL:', error);
  }
  
  // Load saved streams from storage
  loadStreamsFromStorage();
});

// Show/hide add stream form
addStreamBtn.addEventListener('click', () => {
  addStreamForm.style.display = 'block';
  streamUrlInput.focus();
});

cancelBtn.addEventListener('click', () => {
  addStreamForm.style.display = 'none';
  streamUrlInput.value = '';
});

// Connect to stream
connectBtn.addEventListener('click', async () => {
  const url = streamUrlInput.value.trim();
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
    chatContainer.innerHTML = '<div class="empty-state"><p>⏳ Connecting...</p></div>';
    
    // Connect to backend
    const apiEndpoint = `${API_URL}/api/v1/${platform}`;
    
    console.log(`Connecting to ${platform}:`, { apiEndpoint, channelName, videoId });
    
    let response;
    if (platform === 'youtube') {
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, url })
      });
    } else if (platform === 'twitch') {
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, url })
      });
    } else if (platform === 'kick') {
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, url })
      });
    }
    
    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API Response data:', data);
    
    if (data.success && data.connection) {
      // Add stream to list
      const stream = {
        id: data.connection.id,
        platform: data.connection.platform,
        channelName: data.connection.channel,
        url,
        title: data.connection.title || data.connection.channel,
        connectedAt: Date.now()
      };
      
      streams.push(stream);
      saveStreamsToStorage();
      renderStreamsList();
      
      // Subscribe via WebSocket
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      } else {
        ws.send(JSON.stringify({ type: 'subscribe', connectionId: stream.id }));
      }
      
      // Set as active stream
      setActiveStream(stream.id);
      
      // Hide form
      addStreamForm.style.display = 'none';
      streamUrlInput.value = '';
      
      chatContainer.innerHTML = '<div class="empty-state"><p>✅ Connected! Waiting for messages...</p></div>';
    } else {
      throw new Error(data.message || 'Connection failed');
    }
  } catch (error) {
    console.error('Connection error:', error);
    chatContainer.innerHTML = `<div class="empty-state"><p>❌ Error: ${error.message}</p><p style="font-size: 10px;">Check console (F12) for details</p></div>`;
  }
});

// WebSocket connection
function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  
  ws = new WebSocket(WS_URL);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    // Subscribe to all streams
    streams.forEach(stream => {
      ws.send(JSON.stringify({ type: 'subscribe', connectionId: stream.id }));
    });
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        const msg = Array.isArray(data.payload) ? data.payload : [data.payload];
        msg.forEach(m => {
          const stream = streams.find(s => s.id === data.connectionId);
          if (stream) {
            addMessage({
              streamId: data.connectionId,
              platform: stream.platform,
              author: m.username,
              text: m.message,
              isQuestion: m.message?.trim().endsWith('?'),
              timestamp: Date.now()
            });
          }
        });
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
    setTimeout(connectWebSocket, 3000); // Reconnect
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Add message
function addMessage(message) {
  allMessages.push(message);
  if (allMessages.length > 500) {
    allMessages = allMessages.slice(-500); // Keep last 500
  }
  updateDisplay();
}

// Render streams list
function renderStreamsList() {
  if (streams.length === 0) {
    streamsList.innerHTML = '<div class="empty-state-small">No streams connected</div>';
    return;
  }
  
  streamsList.innerHTML = streams.map(stream => `
    <div class="stream-item ${stream.id === activeStreamId ? 'active' : ''}" data-stream-id="${stream.id}">
      <div class="stream-info">
        <span class="stream-platform">${stream.platform}</span>
        <span>${stream.title}</span>
      </div>
      <button class="stream-remove" data-stream-id="${stream.id}">✕</button>
    </div>
  `).join('');
  
  // Add click handlers
  streamsList.querySelectorAll('.stream-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('stream-remove')) {
        setActiveStream(item.dataset.streamId);
      }
    });
  });
  
  streamsList.querySelectorAll('.stream-remove').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await removeStream(btn.dataset.streamId);
    });
  });
}

// Set active stream
function setActiveStream(streamId) {
  activeStreamId = streamId;
  renderStreamsList();
  updateDisplay();
}

// Remove stream
async function removeStream(streamId) {
  const stream = streams.find(s => s.id === streamId);
  if (!stream) return;
  
  try {
    // Disconnect from backend
    await fetch(`${API_URL}/api/v1/${stream.platform}/${streamId}`, { method: 'DELETE' });
    
    // Unsubscribe from WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'unsubscribe', connectionId: streamId }));
    }
    
    // Remove from list
    streams = streams.filter(s => s.id !== streamId);
    allMessages = allMessages.filter(m => m.streamId !== streamId);
    
    if (activeStreamId === streamId) {
      activeStreamId = streams.length > 0 ? streams[0].id : null;
    }
    
    saveStreamsToStorage();
    renderStreamsList();
    updateDisplay();
  } catch (error) {
    console.error('Remove stream error:', error);
  }
}

// Filter buttons
filterAllBtn.addEventListener('click', () => {
  filterMode = 'all';
  filterAllBtn.classList.add('active');
  filterQuestionsBtn.classList.remove('active');
  updateDisplay();
});

filterQuestionsBtn.addEventListener('click', () => {
  filterMode = 'questions';
  filterQuestionsBtn.classList.add('active');
  filterAllBtn.classList.remove('active');
  updateDisplay();
});

// Update display
function updateDisplay() {
  chatContainer.innerHTML = '';
  
  // Filter messages
  let filtered = allMessages;
  
  // Filter by active stream if one is selected
  if (activeStreamId) {
    filtered = filtered.filter(m => m.streamId === activeStreamId);
  }
  
  // Filter by questions if needed
  if (filterMode === 'questions') {
    filtered = filtered.filter(m => m.isQuestion);
  }
  
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
      <span class="message-author">${escapeHtml(msg.author)}</span>
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

// Storage
function saveStreamsToStorage() {
  try {
    const data = streams.map(s => ({
      id: s.id,
      platform: s.platform,
      channelName: s.channelName,
      url: s.url,
      title: s.title,
      connectedAt: s.connectedAt
    }));
    chrome.storage.local.set({ streams: data });
  } catch (error) {
    console.error('Save error:', error);
  }
}

async function loadStreamsFromStorage() {
  try {
    const result = await chrome.storage.local.get(['streams']);
    if (result.streams && result.streams.length > 0) {
      streams = result.streams;
      activeStreamId = streams[0].id;
      renderStreamsList();
      connectWebSocket();
    }
  } catch (error) {
    console.error('Load error:', error);
  }
}
