// Popup script
const HIDE_ORIGINAL_KEY = 'mellchat_hide_original';

// Load settings
chrome.storage.sync.get([HIDE_ORIGINAL_KEY], (result) => {
  document.getElementById('hideOriginal').checked = result[HIDE_ORIGINAL_KEY] === true;
});

// Save settings
document.getElementById('hideOriginal').addEventListener('change', (e) => {
  chrome.storage.sync.set({ [HIDE_ORIGINAL_KEY]: e.target.checked });
});

// Open side panel
document.getElementById('openSidePanel').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.sidePanel.open({ windowId: tabs[0].windowId });
  });
});

