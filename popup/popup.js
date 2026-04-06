// ChatNugget — Popup Script v2.0.0

(function() {
  'use strict';

  var currentFilter = 'all';
  var currentTagFilter = null;
  var searchQuery = '';

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

  // Load and render bookmarks
  function loadBookmarks() {
    chrome.storage.local.get({ bookmarks: [] }, function(data) {
      var bookmarks = data.bookmarks;
      document.getElementById('bookmark-count').textContent = bookmarks.length;
      renderBookmarks(bookmarks);
      renderTagCloud(bookmarks);
    });
  }

  // Render tag cloud
  function renderTagCloud(bookmarks) {
    var tagCounts = {};
    bookmarks.forEach(function(b) {
      (b.tags || []).forEach(function(tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    var container = document.getElementById('tag-cloud');
    container.innerHTML = '';
    var tags = Object.keys(tagCounts).sort(function(a, b) { return tagCounts[b] - tagCounts[a]; });
    if (tags.length === 0) { container.style.display = 'none'; return; }
    container.style.display = 'flex';
    tags.slice(0, 8).forEach(function(tag) {
      var chip = document.createElement('button');
      chip.className = 'tag-chip' + (currentTagFilter === tag ? ' active' : '');
      chip.innerHTML = '#' + tag + ' <span class="tag-count">' + tagCounts[tag] + '</span>';
      chip.addEventListener('click', function() {
        currentTagFilter = currentTagFilter === tag ? null : tag;
        loadBookmarks();
      });
      container.appendChild(chip);
    });
  }

  // Format date for grouping
  function formatDateGroup(dateStr) {
    var d = new Date(dateStr);
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    var bDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (bDate.getTime() === today.getTime()) return 'Today';
    if (bDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  // Highlight search matches in text
  function highlightMatch(text, query) {
    if (!query) return text;
    var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp('(' + escaped + ')', 'gi'), '<span class="search-hl">$1</span>');
  }

  // Render bookmarks list
  function renderBookmarks(bookmarks) {
    var list = document.getElementById('bookmarks-list');
    var empty = document.getElementById('empty-state');

    // Filter
    var filtered = bookmarks.filter(function(b) {
      if (currentFilter !== 'all' && b.platform !== currentFilter) return false;
      if (currentTagFilter && (!b.tags || b.tags.indexOf(currentTagFilter) === -1)) return false;
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        var haystack = (b.title + ' ' + b.text + ' ' + (b.note || '') + ' ' + (b.tags || []).join(' ')).toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      return true;
    });

    // Sort: pinned first, then by timestamp
    filtered.sort(function(a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    list.innerHTML = '';
    if (filtered.length === 0) {
      list.appendChild(empty);
      empty.style.display = 'flex';
      return;
    }
    empty.style.display = 'none';

    var lastGroup = '';
    filtered.forEach(function(bookmark) {
      var group = bookmark.pinned ? 'Pinned' : formatDateGroup(bookmark.timestamp);
      if (group !== lastGroup) {
        var header = document.createElement('div');
        header.className = 'date-header';
        header.textContent = group;
        if (group === 'Pinned') header.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#6C5CE7" stroke="#6C5CE7" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg> Pinned';
        list.appendChild(header);
        lastGroup = group;
      }

      var card = document.createElement('div');
      card.className = 'bm-card' + (bookmark.pinned ? ' bm-card-pinned' : '');

      var previewText = bookmark.text.length > 120 ? bookmark.text.substring(0, 120) + '...' : bookmark.text;
      var titleHtml = highlightMatch(bookmark.title, searchQuery);
      var textHtml = highlightMatch(previewText.replace(/</g, '&lt;').replace(/>/g, '&gt;'), searchQuery);

      var cardHTML = '<div class="bm-title">' + titleHtml + '</div>'
        + '<div class="bm-text">' + textHtml + '</div>';

      if (bookmark.note) {
        cardHTML += '<div class="bm-note">' + highlightMatch(bookmark.note.replace(/</g, '&lt;').replace(/>/g, '&gt;'), searchQuery) + '</div>';
      }

      cardHTML += '<div class="bm-bottom">'
        + '<div class="bm-tags">'
        + '<span class="platform-dot platform-dot-' + bookmark.platform + '"></span>';

      (bookmark.tags || []).forEach(function(tag) {
        cardHTML += '<span class="bookmark-tag">#' + tag + '</span>';
      });

      cardHTML += '</div>'
        + '<span class="bm-time">' + formatTime(bookmark.timestamp) + '</span>'
        + '</div>';

      // Hover actions
      cardHTML += '<div class="bm-actions">'
        + '<button class="bm-action-btn bm-pin-btn" title="' + (bookmark.pinned ? 'Unpin' : 'Pin to top') + '">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="' + (bookmark.pinned ? '#6C5CE7' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>'
        + '</button>'
        + '<button class="bm-action-btn bm-goto-btn" title="Go to chat">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>'
        + '</button>'
        + '<button class="bm-action-btn bm-delete-btn" title="Delete">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
        + '</button>'
        + '</div>';

      card.innerHTML = cardHTML;

      // Pin button handler
      card.querySelector('.bm-pin-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        togglePin(bookmark.id);
      });

      // Go to chat button handler
      card.querySelector('.bm-goto-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        navigateToBookmark(bookmark);
      });

      // Delete button handler
      card.querySelector('.bm-delete-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        deleteBookmark(bookmark.id);
      });

      list.appendChild(card);
    });
  }

  // Toggle pin status
  function togglePin(id) {
    chrome.storage.local.get({ bookmarks: [] }, function(data) {
      var bookmarks = data.bookmarks.map(function(b) {
        if (b.id === id) b.pinned = !b.pinned;
        return b;
      });
      chrome.storage.local.set({ bookmarks: bookmarks }, function() {
        loadBookmarks();
      });
    });
  }

  // Delete bookmark
  function deleteBookmark(id) {
    chrome.storage.local.get({ bookmarks: [] }, function(data) {
      var bookmarks = data.bookmarks.filter(function(b) { return b.id !== id; });
      chrome.storage.local.set({ bookmarks: bookmarks }, function() {
        loadBookmarks();
        chrome.runtime.sendMessage({ action: 'bookmarkDeleted' });
      });
    });
  }

  // Navigate to bookmarked section — hybrid: Text Fragments + JS fallback
  function navigateToBookmark(bookmark) {
    var baseUrl = (bookmark.url || '').split('#')[0];
    var textFrag = bookmark.textFragment;
    if (!textFrag && bookmark.textAnchor) {
      textFrag = generateTextFragment(bookmark.textAnchor);
    }

    var navUrl = baseUrl;
    if (textFrag) {
      navUrl = baseUrl + '#:~:text=' + textFrag;
    }

    chrome.tabs.create({ url: navUrl, active: true }, function(newTab) {
      function onUpdated(tabId, info) {
        if (tabId === newTab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);
          setTimeout(function() {
            chrome.tabs.sendMessage(newTab.id, {
              action: 'scrollToBookmark',
              textAnchor: bookmark.textAnchor || bookmark.text
            });
          }, 3000);
        }
      }
      chrome.tabs.onUpdated.addListener(onUpdated);
    });
  }

  // Export bookmarks
  function exportBookmarks() {
    chrome.storage.local.get({ bookmarks: [] }, function(data) {
      var blob = new Blob([JSON.stringify(data.bookmarks, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'chatnugget-bookmarks.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Import bookmarks
  function importBookmarks(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        chrome.storage.local.get({ bookmarks: [] }, function(data) {
          var merged = data.bookmarks.concat(imported);
          chrome.storage.local.set({ bookmarks: merged }, function() {
            loadBookmarks();
            chrome.runtime.sendMessage({ action: 'bookmarkSaved' });
          });
        });
      } catch (err) {
        alert('Invalid file format. Please select a valid ChatNugget JSON export.');
      }
    };
    reader.readAsText(file);
  }

  // Event listeners
  document.getElementById('search-input').addEventListener('input', function(e) {
    searchQuery = e.target.value.trim();
    loadBookmarks();
  });

  document.getElementById('filter-bar').addEventListener('click', function(e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
    chip.classList.add('active');
    currentFilter = chip.dataset.platform;
    loadBookmarks();
  });

  document.getElementById('btn-export').addEventListener('click', exportBookmarks);
  document.getElementById('btn-import').addEventListener('click', function() {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', function(e) {
    if (e.target.files[0]) importBookmarks(e.target.files[0]);
  });

  // Initialize
  loadBookmarks();

})();
