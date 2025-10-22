// YouTube chat filter
(function() {
  'use strict';

  console.log('MellChat: YouTube filter loaded');

  // Config
  const FILTER_ENABLED_KEY = 'mellchat_filter_enabled';
  const HIDE_ORIGINAL_KEY = 'mellchat_hide_original';
  
  let filterEnabled = true;
  let hideOriginal = false;
  
  // Load settings
  chrome.storage.sync.get([FILTER_ENABLED_KEY, HIDE_ORIGINAL_KEY], (result) => {
    filterEnabled = result[FILTER_ENABLED_KEY] !== false;
    hideOriginal = result[HIDE_ORIGINAL_KEY] === true;
    if (hideOriginal) {
      hideOriginalChat();
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes[HIDE_ORIGINAL_KEY]) {
        hideOriginal = changes[HIDE_ORIGINAL_KEY].newValue;
        if (hideOriginal) {
          hideOriginalChat();
        } else {
          showOriginalChat();
        }
      }
    }
  });

  // Hide original YouTube chat
  function hideOriginalChat() {
    const chatFrame = document.querySelector('#chat-container, #chat, ytd-live-chat-frame');
    if (chatFrame) {
      chatFrame.style.display = 'none';
      console.log('MellChat: Original chat hidden');
    }
  }

  // Show original YouTube chat
  function showOriginalChat() {
    const chatFrame = document.querySelector('#chat-container, #chat, ytd-live-chat-frame');
    if (chatFrame) {
      chatFrame.style.display = '';
      console.log('MellChat: Original chat shown');
    }
  }

  // Filter messages
  function filterMessage(messageElement) {
    const text = messageElement.textContent || '';
    
    // Questions filter
    if (text.trim().endsWith('?')) {
      messageElement.classList.add('mellchat-question');
    }
    
    // Spam detection (simple)
    if (text.length > 200 || /(.)\1{10,}/.test(text)) {
      messageElement.classList.add('mellchat-spam');
      if (filterEnabled) {
        messageElement.style.opacity = '0.3';
      }
    }
  }

  // Observe chat messages
  function observeChat() {
    const chatContainer = document.querySelector('#chat, #chatframe, ytd-live-chat-frame');
    if (!chatContainer) {
      setTimeout(observeChat, 1000);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // YouTube chat messages
            if (node.matches('yt-live-chat-text-message-renderer')) {
              filterMessage(node);
            }
            // Check children
            const messages = node.querySelectorAll('yt-live-chat-text-message-renderer');
            messages.forEach(filterMessage);
          }
        });
      });
    });

    observer.observe(chatContainer, { 
      childList: true, 
      subtree: true 
    });
    
    console.log('MellChat: Observing YouTube chat');
  }

  // Start observing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeChat);
  } else {
    observeChat();
  }

  // Toggle button in YouTube UI
  function addToggleButton() {
    const targetContainer = document.querySelector('#chat-container, ytd-live-chat-frame');
    if (!targetContainer || document.querySelector('.mellchat-toggle')) {
      return;
    }

    const button = document.createElement('button');
    button.className = 'mellchat-toggle';
    button.textContent = hideOriginal ? 'Show Chat' : 'Hide Chat';
    button.onclick = () => {
      hideOriginal = !hideOriginal;
      chrome.storage.sync.set({ [HIDE_ORIGINAL_KEY]: hideOriginal });
      button.textContent = hideOriginal ? 'Show Chat' : 'Hide Chat';
    };

    targetContainer.parentElement.insertBefore(button, targetContainer);
  }

  setTimeout(addToggleButton, 2000);
})();

