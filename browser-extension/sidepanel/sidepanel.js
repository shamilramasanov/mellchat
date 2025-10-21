// Side panel script
let filterMode = 'all'; // 'all' or 'questions'
const chatContainer = document.getElementById('chatContainer');

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

