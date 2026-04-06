// ChatNugget — Background Service Worker v2.0.0

// Update badge count
function updateBadge() {
  chrome.storage.local.get({ bookmarks: [] }, function(data) {
    var count = data.bookmarks.length;
    var text = count > 0 ? String(count) : '';
    chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: '#6C5CE7' });
  });
}

// Initialize badge on install/startup
chrome.runtime.onInstalled.addListener(function() {
  updateBadge();
  chrome.contextMenus.create({
    id: 'chatnugget-bookmark',
    title: 'Bookmark this with ChatNugget',
    contexts: ['selection'],
    documentUrlPatterns: [
      'https://claude.ai/*',
      'https://chat.openai.com/*',
      'https://chatgpt.com/*',
      'https://gemini.google.com/*'
    ]
  });
});

chrome.runtime.onStartup.addListener(function() {
  updateBadge();
});

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener(function(changes, area) {
  if (area === 'local' && changes.bookmarks) {
    updateBadge();
  }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === 'chatnugget-bookmark') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'triggerBookmark',
      text: info.selectionText
    });
  }
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener(function(command) {
  if (command === 'bookmark-selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'triggerBookmark'
        });
      }
    });
  }
});

// Message handler
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'bookmarkSaved') {
    updateBadge();
    sendResponse({ success: true });
  }
  if (request.action === 'bookmarkDeleted') {
    updateBadge();
    sendResponse({ success: true });
  }
  if (request.action === 'getBadgeCount') {
    chrome.storage.local.get({ bookmarks: [] }, function(data) {
      sendResponse({ count: data.bookmarks.length });
    });
    return true;
  }
});

// Detect platform from URL
function detectPlatformFromUrl(url) {
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) return 'chatgpt';
  if (url.includes('gemini.google.com')) return 'gemini';
  return 'unknown';
}
