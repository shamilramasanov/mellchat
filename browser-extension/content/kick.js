// Kick chat filter
(function() {
  'use strict';

  console.log('MellChat: Kick filter loaded');

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
    const chat = document.querySelector('#chatroom, .chatroom');
    if (chat) {
      chat.style.display = 'none';
      console.log('MellChat: Kick chat hidden');
    }
  }

  function showOriginalChat() {
    const chat = document.querySelector('#chatroom, .chatroom');
    if (chat) {
      chat.style.display = '';
      console.log('MellChat: Kick chat shown');
    }
  }

  function filterMessage(messageElement) {
    const text = messageElement.textContent || '';
    if (text.trim().endsWith('?')) {
      messageElement.classList.add('mellchat-question');
    }
  }

  function observeChat() {
    const chatContainer = document.querySelector('.chat-feed, #chat-messages');
    if (!chatContainer) {
      setTimeout(observeChat, 1000);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.matches('.chat-message')) {
              filterMessage(node);
            }
          }
        });
      });
    });

    observer.observe(chatContainer, { childList: true, subtree: true });
    console.log('MellChat: Observing Kick chat');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeChat);
  } else {
    observeChat();
  }
})();

