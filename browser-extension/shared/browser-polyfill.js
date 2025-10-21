// Browser API polyfill for cross-browser compatibility
// Unifies chrome.* and browser.* APIs

(function() {
  'use strict';

  // If browser API exists (Firefox), use it
  if (typeof browser !== 'undefined' && browser.runtime) {
    window.browserAPI = browser;
    return;
  }

  // Otherwise, use chrome API (Chrome, Edge, Opera)
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Create a promisified version of chrome API
    window.browserAPI = {
      runtime: chrome.runtime,
      storage: {
        local: {
          get: (keys) => new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, (result) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(result);
              }
            });
          }),
          set: (items) => new Promise((resolve, reject) => {
            chrome.storage.local.set(items, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve();
              }
            });
          }),
          remove: (keys) => new Promise((resolve, reject) => {
            chrome.storage.local.remove(keys, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve();
              }
            });
          })
        }
      },
      tabs: {
        query: (queryInfo) => new Promise((resolve, reject) => {
          chrome.tabs.query(queryInfo, (tabs) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(tabs);
            }
          });
        }),
        sendMessage: (tabId, message) => new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        })
      }
    };

    // Add sidePanel API if available (Chrome 114+)
    if (chrome.sidePanel) {
      window.browserAPI.sidePanel = chrome.sidePanel;
    }
  }
})();

