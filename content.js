// ChatNugget — Content Script v2.0.0
// Bookmark specific sections within AI conversations

(function() {
  'use strict';

  function detectPlatform() {
    var host = window.location.hostname;
    if (host.includes('claude.ai')) return 'claude';
    if (host.includes('chat.openai.com') || host.includes('chatgpt.com')) return 'chatgpt';
    if (host.includes('gemini.google.com')) return 'gemini';
    return 'unknown';
  }

  var PLATFORM = detectPlatform();

  // Generate text fragment for deep-linking
  function generateTextFragment(text) {
    var clean = text.trim();
    var words = clean.split(/\s+/);
    if (words.length <= 12) {
      var exact = words.slice(0, 8).join(' ');
      return encodeURIComponent(exact);
    } else {
      var startWords = words.slice(0, 6).join(' ');
      var endWords = words.slice(-6).join(' ');
      return encodeURIComponent(startWords) + ',' + encodeURIComponent(endWords);
    }
  }

  // Floating bookmark button
  var floatingBtn = null;

  function createFloatingButton() {
    if (floatingBtn) return;
    floatingBtn = document.createElement('div');
    floatingBtn.className = 'chatnugget-float-btn';
    floatingBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Bookmark';
    floatingBtn.style.display = 'none';
    document.body.appendChild(floatingBtn);
    floatingBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        showBookmarkDialog(sel.toString().trim());
      }
      floatingBtn.style.display = 'none';
    });
  }

  // Position and show the floating button near selection
  function showFloatingButton() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.toString().trim().length === 0) {
      if (floatingBtn) floatingBtn.style.display = 'none';
      return;
    }
    createFloatingButton();
    var range = sel.getRangeAt(0);
    var rect = range.getBoundingClientRect();
    floatingBtn.style.top = (window.scrollY + rect.top - 40) + 'px';
    floatingBtn.style.left = (window.scrollX + rect.left + (rect.width / 2) - 50) + 'px';
    floatingBtn.style.display = 'flex';
  }

  // Listen for text selection
  document.addEventListener('mouseup', function(e) {
    setTimeout(function() {
      if (floatingBtn && floatingBtn.contains(e.target)) return;
      showFloatingButton();
    }, 10);
  });

  document.addEventListener('mousedown', function(e) {
    if (floatingBtn && !floatingBtn.contains(e.target)) {
      floatingBtn.style.display = 'none';
    }
  });

  // Show bookmark dialog
  function showBookmarkDialog(selectedText) {
    var existing = document.querySelector('.chatnugget-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'chatnugget-overlay';

    var chatTitle = document.title || 'Untitled Chat';
    var previewText = selectedText.length > 200 ? selectedText.substring(0, 200) + '...' : selectedText;

    var dialogHTML = '<div class="chatnugget-dialog">'
      + '<div class="chatnugget-dialog-header">'
      + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>'
      + '<h3>Save Nugget</h3>'
      + '<span class="chatnugget-shortcut-hint">Ctrl+Enter to save</span>'
      + '</div>'
      + '<div class="chatnugget-dialog-body">'
      + '<div class="chatnugget-preview-box">'
      + '<div class="chatnugget-preview-label">Selected text</div>'
      + '<div class="chatnugget-preview-text">' + previewText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>'
      + '</div>'
      + '<div class="chatnugget-field">'
      + '<label>Title</label>'
      + '<input type="text" id="chatnugget-title" placeholder="Give this nugget a name..." value="" />'
      + '</div>'
      + '<div class="chatnugget-field">'
      + '<label>Tags <span class="chatnugget-hint">(comma-separated)</span></label>'
      + '<input type="text" id="chatnugget-tags" placeholder="e.g. python, backend, idea" />'
      + '</div>'
      + '<div class="chatnugget-field">'
      + '<label>Note <span class="chatnugget-hint">(optional)</span></label>'
      + '<textarea id="chatnugget-note" rows="2" placeholder="Why is this worth saving?"></textarea>'
      + '</div>'
      + '<div class="chatnugget-meta-row">'
      + '<span class="chatnugget-platform-badge chatnugget-platform-' + PLATFORM + '">' + PLATFORM.toUpperCase() + '</span>'
      + '<span class="chatnugget-meta-title">' + chatTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>'
      + '</div>'
      + '</div>';

    dialogHTML += '<div class="chatnugget-dialog-footer">'
      + '<button class="chatnugget-btn-cancel">Cancel</button>'
      + '<button class="chatnugget-btn-save">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>'
      + ' Save Nugget'
      + '</button>'
      + '</div>'
      + '</div>';

    overlay.innerHTML = dialogHTML;
    document.body.appendChild(overlay);

    // Auto-generate title from first few words
    var words = selectedText.split(/\s+/).slice(0, 6).join(' ');
    var titleInput = document.getElementById('chatnugget-title');
    if (titleInput) titleInput.value = words.length > 40 ? words.substring(0, 40) + '...' : words;

    // Focus title field
    setTimeout(function() { if (titleInput) titleInput.focus(); }, 100);

    // Cancel button
    overlay.querySelector('.chatnugget-btn-cancel').addEventListener('click', function() {
      overlay.remove();
    });

    // Click outside to close
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });

    // Save button
    overlay.querySelector('.chatnugget-btn-save').addEventListener('click', function() {
      saveBookmark(selectedText, overlay);
    });

    // Ctrl+Enter to save
    overlay.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveBookmark(selectedText, overlay);
      }
      if (e.key === 'Escape') {
        overlay.remove();
      }
    });
  }

  // Save bookmark to storage
  function saveBookmark(selectedText, overlay) {
    var title = document.getElementById('chatnugget-title').value.trim() || 'Untitled';
    var tagsRaw = document.getElementById('chatnugget-tags').value;
    var note = document.getElementById('chatnugget-note').value.trim();

    var tags = tagsRaw.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t.length > 0; });

    var bookmark = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: title,
      text: selectedText,
      textAnchor: selectedText.substring(0, 150),
      textFragment: generateTextFragment(selectedText),
      tags: tags,
      note: note,
      url: window.location.href.split('#')[0],
      platform: PLATFORM,
      chatTitle: document.title || 'Untitled Chat',
      timestamp: new Date().toISOString(),
      pinned: false
    };

    chrome.storage.local.get({ bookmarks: [] }, function(data) {
      var bookmarks = data.bookmarks;
      bookmarks.unshift(bookmark);
      chrome.storage.local.set({ bookmarks: bookmarks }, function() {
        overlay.remove();
        highlightSelection();
        showToast('Nugget saved!');
        chrome.runtime.sendMessage({ action: 'bookmarkSaved' });
      });
    });
  }

  // Highlight the selected text briefly
  function highlightSelection() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    try {
      var range = sel.getRangeAt(0);
      var span = document.createElement('span');
      span.className = 'chatnugget-highlight-flash';
      range.surroundContents(span);
      setTimeout(function() {
        if (span.parentNode) {
          var parent = span.parentNode;
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }
      }, 3000);
    } catch (e) { /* ignore if range spans multiple elements */ }
  }

  // Toast notification
  function showToast(msg) {
    var toast = document.createElement('div');
    toast.className = 'chatnugget-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('chatnugget-toast-show'); }, 10);
    setTimeout(function() {
      toast.classList.remove('chatnugget-toast-show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
  }

  // Scroll to bookmarked text with retries (fights platform auto-scroll)
  function scrollWithRetries(textAnchor) {
    if (!textAnchor) return;
    var attempt = 0;
    var maxAttempts = 8;
    function tryScroll() {
      attempt++;
      if (doScroll(textAnchor)) {
        // Re-scroll after delays to fight platform auto-scroll
        setTimeout(function() { doScroll(textAnchor); }, 1000);
        setTimeout(function() { doScroll(textAnchor); }, 3000);
      } else if (attempt < maxAttempts) {
        setTimeout(tryScroll, 1000 + (attempt * 500));
      }
    }
    tryScroll();
  }

  // Perform the actual scroll using TreeWalker text search
  function doScroll(textAnchor) {
    var searchLengths = [80, 40, 20];
    for (var i = 0; i < searchLengths.length; i++) {
      var searchText = textAnchor.substring(0, Math.min(searchLengths[i], textAnchor.length));
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      var node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.includes(searchText)) {
          var el = node.parentElement;
          if (el) {
            el.scrollIntoView({ behavior: 'instant', block: 'center' });
            // Add purple outline highlight
            el.style.outline = '3px solid #6C5CE7';
            el.style.outlineOffset = '4px';
            el.style.borderRadius = '4px';
            setTimeout(function() {
              el.style.outline = '';
              el.style.outlineOffset = '';
              el.style.borderRadius = '';
            }, 6000);
            return true;
          }
        }
      }
    }
    return false;
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'scrollToBookmark') {
      scrollWithRetries(request.textAnchor);
      sendResponse({ success: true });
    }
    if (request.action === 'triggerBookmark') {
      var sel = window.getSelection();
      var text = request.text || (sel ? sel.toString().trim() : '');
      if (text.length > 0) {
        showBookmarkDialog(text);
      } else {
        showToast('Select some text first!');
      }
      sendResponse({ success: true });
    }
  });

})();
