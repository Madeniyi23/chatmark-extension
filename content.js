// ChatMark — Content Script v1.1.0
// Uses Chrome Text Fragments API for native scroll-to-text
(function () {
  'use strict';

  function detectPlatform() {
    var host = window.location.hostname;
    if (host.includes('claude.ai')) return 'claude';
    if (host.includes('chat.openai.com') || host.includes('chatgpt.com')) return 'chatgpt';
    if (host.includes('gemini.google.com')) return 'gemini';
    if (host.includes('copilot.microsoft.com')) return 'copilot';
    return 'unknown';
  }

  var PLATFORM = detectPlatform();

  function generateId() {
    return 'cm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function getConversationTitle() {
    var el = document.querySelector('title');
    if (el && el.textContent.trim()) return el.textContent.trim().slice(0, 100);
    el = document.querySelector('h1');
    if (el && el.textContent.trim()) return el.textContent.trim().slice(0, 100);
    return 'Untitled Chat';
  }

  function escapeHtml(str) {    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Generate a Text Fragment string from selected text ──
  // Format: for short text, exact match. For long text, range match.
  // See: https://web.dev/articles/text-fragments
  function generateTextFragment(text) {
    var clean = text.trim();
    if (!clean) return '';
    // Get first ~6 words and last ~6 words
    var words = clean.split(/\s+/);
    if (words.length <= 12) {
      // Short text — use exact match (first 8 words max)
      var exact = words.slice(0, 8).join(' ');
      return encodeURIComponent(exact);
    } else {
      // Long text — use range match: startText,endText
      var startWords = words.slice(0, 6).join(' ');
      var endWords = words.slice(-6).join(' ');
      return encodeURIComponent(startWords) + ',' + encodeURIComponent(endWords);
    }
  }

  // ── Floating Bookmark Button ──
  var floatingBtn = null;
  var currentSelection = null;
  function createFloatingButton() {
    if (floatingBtn) return floatingBtn;
    floatingBtn = document.createElement('div');
    floatingBtn.id = 'chatmark-float-btn';
    floatingBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg><span>Bookmark</span>';
    floatingBtn.style.display = 'none';
    document.body.appendChild(floatingBtn);
    floatingBtn.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (currentSelection) showBookmarkDialog(currentSelection);
    });
    return floatingBtn;
  }

  function showFloatingButton(x, y) {
    var btn = createFloatingButton();
    btn.style.display = 'flex';
    btn.style.left = x + 'px';
    btn.style.top = (y - 45) + 'px';
  }

  function hideFloatingButton() {
    if (floatingBtn) floatingBtn.style.display = 'none';
  }

  document.addEventListener('mouseup', function(e) {
    if (e.target.closest('#chatmark-float-btn, #chatmark-dialog-overlay')) return;    setTimeout(function() {
      var selection = window.getSelection();
      var text = selection ? selection.toString().trim() : '';
      if (text && text.length > 5) {
        var range = selection.getRangeAt(0);
        var rect = range.getBoundingClientRect();
        currentSelection = {
          text: text, fullText: text.slice(0, 2000), range: range.cloneRange(),
          url: window.location.href, platform: PLATFORM,
          conversationTitle: getConversationTitle()
        };
        showFloatingButton(rect.left + rect.width / 2 - 55, rect.top + window.scrollY);
      } else { hideFloatingButton(); currentSelection = null; }
    }, 10);
  });

  document.addEventListener('mousedown', function(e) {
    if (!e.target.closest('#chatmark-float-btn, #chatmark-dialog-overlay')) hideFloatingButton();
  });

  // ── Bookmark Dialog ──
  function showBookmarkDialog(selectionData) {
    hideFloatingButton();
    var overlay = document.createElement('div');
    overlay.id = 'chatmark-dialog-overlay';
    var preview = selectionData.text.length > 200 ? selectionData.text.slice(0, 200) + '...' : selectionData.text;
    overlay.innerHTML = '<div class="chatmark-dialog">' +
      '<div class="chatmark-dialog-header">' +      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>' +
      '<h3>Save Bookmark</h3>' +
      '<button class="chatmark-close-btn" id="chatmark-close">&times;</button></div>' +
      '<div class="chatmark-dialog-body">' +
      '<div class="chatmark-preview"><div class="chatmark-preview-label">Selected text</div>' +
      '<div class="chatmark-preview-text">' + escapeHtml(preview) + '</div></div>' +
      '<div class="chatmark-field"><label for="chatmark-title">Title</label>' +
      '<input type="text" id="chatmark-title" placeholder="Give this bookmark a name..." autocomplete="off" /></div>' +
      '<div class="chatmark-field"><label for="chatmark-tags">Tags <span class="chatmark-hint">(comma-separated)</span></label>' +
      '<input type="text" id="chatmark-tags" placeholder="e.g. code, important, idea" autocomplete="off" /></div>' +
      '<div class="chatmark-field"><label for="chatmark-note">Note <span class="chatmark-hint">(optional)</span></label>' +
      '<textarea id="chatmark-note" rows="2" placeholder="Why is this worth remembering?"></textarea></div>' +
      '<div class="chatmark-meta">' +
      '<span class="chatmark-platform-badge chatmark-platform-' + PLATFORM + '">' + PLATFORM + '</span>' +
      '<span class="chatmark-meta-title">' + escapeHtml(selectionData.conversationTitle.slice(0, 50)) + '</span></div></div>' +
      '<div class="chatmark-dialog-footer">' +
      '<button class="chatmark-btn chatmark-btn-cancel" id="chatmark-cancel">Cancel</button>' +
      '<button class="chatmark-btn chatmark-btn-save" id="chatmark-save">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Save Bookmark</button></div></div>';
    document.body.appendChild(overlay);    setTimeout(function() { var t = document.getElementById('chatmark-title'); if (t) t.focus(); }, 50);
    var close = function() { overlay.remove(); };
    overlay.querySelector('#chatmark-close').addEventListener('click', close);
    overlay.querySelector('#chatmark-cancel').addEventListener('click', close);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    overlay.querySelector('#chatmark-save').addEventListener('click', function() {
      var title = document.getElementById('chatmark-title').value.trim();
      var tags = document.getElementById('chatmark-tags').value.split(',').map(function(t) { return t.trim().toLowerCase(); }).filter(Boolean);
      var note = document.getElementById('chatmark-note').value.trim();

      // Generate the text fragment for this bookmark
      var textFragment = generateTextFragment(selectionData.text);

      // Get the base URL without any existing fragment
      var baseUrl = selectionData.url.split('#')[0];

      var bookmark = {
        id: generateId(),
        title: title || selectionData.text.slice(0, 60) + '...',
        text: selectionData.fullText, tags: tags, note: note,
        url: baseUrl,
        platform: selectionData.platform,
        conversationTitle: selectionData.conversationTitle,
        createdAt: new Date().toISOString(),
        textAnchor: selectionData.text.slice(0, 300),
        textFragment: textFragment
      };
      saveBookmark(bookmark);
      highlightSelection(selectionData.range, bookmark.id);
      close();      showToast('Bookmark saved!');
    });
    overlay.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') close();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') overlay.querySelector('#chatmark-save').click();
    });
  }

  function saveBookmark(bookmark) {
    chrome.storage.local.get({ bookmarks: [] }, function(result) {
      var bookmarks = result.bookmarks;
      bookmarks.unshift(bookmark);
      chrome.storage.local.set({ bookmarks: bookmarks });
    });
  }

  function highlightSelection(range, bookmarkId) {
    try {
      var highlight = document.createElement('mark');
      highlight.className = 'chatmark-highlight';
      highlight.dataset.bookmarkId = bookmarkId;
      highlight.title = 'ChatMark bookmark';
      range.surroundContents(highlight);
    } catch (e) {
      console.log('ChatMark: Could not highlight complex selection, bookmark still saved.');
    }
  }

  function showToast(message) {
    var toast = document.createElement('div');    toast.className = 'chatmark-toast';
    toast.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> ' + escapeHtml(message);
    document.body.appendChild(toast);
    requestAnimationFrame(function() { toast.classList.add('chatmark-toast-visible'); });
    setTimeout(function() {
      toast.classList.remove('chatmark-toast-visible');
      setTimeout(function() { toast.remove(); }, 300);
    }, 2200);
  }

  // ── Message listener — JS scroll fallback when text fragments fail ──
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'scrollToBookmark') {
      console.log('ChatMark: JS fallback scroll triggered');
      scrollWithRetries(message.textAnchor);
      sendResponse({ success: true });
    }
    if (message.action === 'ping') {
      sendResponse({ platform: PLATFORM, url: window.location.href });
    }
  });

  // Retry-based JS scroll — tries multiple times over ~12 seconds
  function scrollWithRetries(textAnchor) {
    if (!textAnchor) return;
    var attempt = 0;
    var maxAttempts = 8;
    function tryScroll() {
      attempt++;
      if (doScroll(textAnchor)) {
        // Found it. Re-scroll a few more times to fight platform auto-scroll
        setTimeout(function() { doScroll(textAnchor); }, 1000);
        setTimeout(function() { doScroll(textAnchor); }, 3000);
      } else if (attempt < maxAttempts) {
        setTimeout(tryScroll, 1000 + (attempt * 500));
      }
    }
    tryScroll();
  }

  function doScroll(textAnchor) {
    // Try several substring lengths
    var lengths = [80, 40, 20];
    for (var i = 0; i < lengths.length; i++) {
      var search = textAnchor.slice(0, Math.min(lengths[i], textAnchor.length));
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      var node;
      while (node = walker.nextNode()) {
        var parent = node.parentElement;
        if (!parent) continue;
        if (parent.closest('#chatmark-float-btn, #chatmark-dialog-overlay, .chatmark-toast')) continue;
        if (node.textContent.indexOf(search) >= 0) {
          // Scroll to the block-level parent for better positioning
          var target = parent;
          while (target.parentElement && target.parentElement !== document.body) {
            var d = window.getComputedStyle(target).display;
            if (d === 'block' || d === 'flex' || d === 'list-item') break;
            target = target.parentElement;
          }
          target.scrollIntoView({ behavior: 'instant', block: 'center' });
          // Add purple highlight
          target.style.outline = '3px solid #6C5CE7';
          target.style.outlineOffset = '4px';
          target.style.borderRadius = '6px';
          target.style.transition = 'outline 0.3s ease';
          setTimeout(function() {
            target.style.outline = '';
            target.style.outlineOffset = '';
          }, 6000);
          return true;
        }
      }
    }
    return false;
  }

  console.log('ChatMark v1.2.0 loaded on ' + PLATFORM);
})();