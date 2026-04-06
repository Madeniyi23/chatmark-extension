// ChatMark — Background Service Worker

// ─── Context Menu ───────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'chatmark-bookmark-selection',
    title: 'Bookmark this with ChatMark',
    contexts: ['selection'],
    documentUrlPatterns: [
      'https://claude.ai/*',
      'https://chat.openai.com/*',
      'https://chatgpt.com/*',
      'https://gemini.google.com/*',
      'https://copilot.microsoft.com/*',
    ],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'chatmark-bookmark-selection' && info.selectionText) {
    const bookmark = {
      id: 'cm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
      title: info.selectionText.slice(0, 60) + (info.selectionText.length > 60 ? '...' : ''),
      text: info.selectionText.slice(0, 2000),
      tags: [],
      note: '',
      url: tab.url,      platform: detectPlatformFromUrl(tab.url),
      conversationTitle: tab.title || 'Untitled Chat',
      createdAt: new Date().toISOString(),
      textAnchor: info.selectionText.slice(0, 300),
    };

    chrome.storage.local.get({ bookmarks: [] }, (result) => {
      const bookmarks = result.bookmarks;
      bookmarks.unshift(bookmark);
      chrome.storage.local.set({ bookmarks });
    });
  }
});

// ─── Message Handling ───────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopup') {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#6C5CE7' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 3000);
  }
});

// ─── Keyboard Shortcut ──────────────────────────────────────
chrome.commands?.onCommand?.addListener((command) => {
  if (command === 'quick-bookmark') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'triggerBookmark' });
      }
    });
  }
});

// ─── Utility ────────────────────────────────────────────────
function detectPlatformFromUrl(url) {
  if (!url) return 'unknown';
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) return 'chatgpt';
  if (url.includes('gemini.google.com')) return 'gemini';
  if (url.includes('copilot.microsoft.com')) return 'copilot';
  return 'unknown';
}