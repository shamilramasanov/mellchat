// Twitch chat filter
(function() {
  'use strict';

  console.log('MellChat: Twitch filter loaded');

  const HIDE_ORIGINAL_KEY = 'mellchat_hide_original';
  let hideOriginal = false;
  
  chrome.storage.sync.get([HIDE_ORIGINAL_KEY], (result) => {
    hideOriginal = result[HIDE_ORIGINAL_KEY] === true;
    if (hideOriginal) {
      hideOriginalChat();
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes[HIDE_ORIGINAL_KEY]) {
      hideOriginal = changes[HIDE_ORIGINAL_KEY].newValue;
      hideOriginal ? hideOriginalChat() : showOriginalChat();
    }
  });

  function hideOriginalChat() {
    const chat = document.querySelector('.chat-shell, [data-a-target="chat-scroller"]');
    if (chat) {
      chat.style.display = 'none';
      console.log('MellChat: Twitch chat hidden');
    }
  }

  function showOriginalChat() {
    const chat = document.querySelector('.chat-shell, [data-a-target="chat-scroller"]');
    if (chat) {
      chat.style.display = '';
      console.log('MellChat: Twitch chat shown');
    }
  }

  function filterMessage(messageElement) {
    const text = messageElement.textContent || '';
    if (text.trim().endsWith('?')) {
      messageElement.classList.add('mellchat-question');
    }
  }

  function observeChat() {
    const chatContainer = document.querySelector('.chat-scrollable-area__message-container');
    if (!chatContainer) {
      setTimeout(observeChat, 1000);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.matches('.chat-line__message')) {
              filterMessage(node);
            }
          }
        });
      });
    });

    observer.observe(chatContainer, { childList: true, subtree: true });
    console.log('MellChat: Observing Twitch chat');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeChat);
  } else {
    observeChat();
  }
})();

