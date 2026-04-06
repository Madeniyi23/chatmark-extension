// ChatMark — Popup Script v1.1.0
// Uses Chrome Text Fragments for navigation
(function () {
  'use strict';

  var allBookmarks = [];
  var activeFilter = 'all';
  var activeTag = null;

  var searchInput = document.getElementById('search-input');
  var clearBtn = document.getElementById('clear-search');
  var container = document.getElementById('bookmarks-container');
  var emptyState = document.getElementById('empty-state');
  var noResults = document.getElementById('no-results');
  var bookmarkCount = document.getElementById('bookmark-count');
  var tagCloud = document.getElementById('tag-cloud');

  function loadBookmarks() {
    chrome.storage.local.get({ bookmarks: [] }, function(result) {
      allBookmarks = result.bookmarks;
      bookmarkCount.textContent = allBookmarks.length;
      renderTagCloud();
      renderBookmarks();
    });
  }

  function renderTagCloud() {
    var tagCounts = {};
    allBookmarks.forEach(function(b) {      (b.tags || []).forEach(function(tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    var tags = Object.entries(tagCounts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 15);
    if (tags.length === 0) { tagCloud.style.display = 'none'; return; }
    tagCloud.style.display = 'flex';
    tagCloud.innerHTML = tags.map(function(pair) {
      return '<button class="tag-chip ' + (activeTag === pair[0] ? 'tag-chip-active' : '') + '" data-tag="' + escapeHtml(pair[0]) + '">#' + escapeHtml(pair[0]) + ' <span class="tag-count">' + pair[1] + '</span></button>';
    }).join('');
    tagCloud.querySelectorAll('.tag-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        activeTag = (activeTag === chip.dataset.tag) ? null : chip.dataset.tag;
        renderTagCloud(); renderBookmarks();
      });
    });
  }

  function getFilteredBookmarks() {
    var filtered = allBookmarks.slice();
    var query = searchInput.value.trim().toLowerCase();
    if (activeFilter !== 'all') filtered = filtered.filter(function(b) { return b.platform === activeFilter; });
    if (activeTag) filtered = filtered.filter(function(b) { return (b.tags || []).indexOf(activeTag) >= 0; });
    if (query) {
      filtered = filtered.filter(function(b) {
        return [b.title, b.text, b.note, b.conversationTitle].concat(b.tags || []).filter(Boolean).join(' ').toLowerCase().indexOf(query) >= 0;
      });
    }
    return filtered;
  }
  function renderBookmarks() {
    var filtered = getFilteredBookmarks();
    emptyState.style.display = allBookmarks.length === 0 ? 'flex' : 'none';
    noResults.style.display = (allBookmarks.length > 0 && filtered.length === 0) ? 'flex' : 'none';
    container.style.display = filtered.length > 0 ? 'block' : 'none';
    if (filtered.length === 0) { container.innerHTML = ''; return; }
    var groups = groupByDate(filtered);
    var html = '';
    Object.keys(groups).forEach(function(date) {
      html += '<div class="date-group"><div class="date-header">' + escapeHtml(date) + '</div>';
      groups[date].forEach(function(b) { html += renderBookmarkCard(b); });
      html += '</div>';
    });
    container.innerHTML = html;
    attachCardHandlers();
  }

  function attachCardHandlers() {
    container.querySelectorAll('.bookmark-card').forEach(function(card) {
      var id = card.dataset.id;
      var gotoBtn = card.querySelector('.bookmark-goto');
      if (gotoBtn) {
        gotoBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          var bm = allBookmarks.find(function(b) { return b.id === id; });
          if (bm) navigateToBookmark(bm);
        });
      }      var deleteBtn = card.querySelector('.bookmark-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
          e.stopPropagation(); deleteBookmark(id);
        });
      }
      var copyBtn = card.querySelector('.bookmark-copy');
      if (copyBtn) {
        copyBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          var bm = allBookmarks.find(function(b) { return b.id === id; });
          if (bm) {
            navigator.clipboard.writeText(bm.text);
            e.currentTarget.textContent = 'Copied!';
            var btn = e.currentTarget;
            setTimeout(function() {
              btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
            }, 1200);
          }
        });
      }
      card.querySelectorAll('.bookmark-tag').forEach(function(tagEl) {
        tagEl.addEventListener('click', function(e) {
          e.stopPropagation();
          activeTag = tagEl.dataset.tag;
          renderTagCloud(); renderBookmarks();
        });
      });
    });
  }
  function renderBookmarkCard(bm) {
    var preview = bm.text.length > 180 ? bm.text.slice(0, 180) + '...' : bm.text;
    var time = new Date(bm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var hp = highlightSearch(escapeHtml(preview));
    var ht = highlightSearch(escapeHtml(bm.title));
    var tagsHtml = (bm.tags || []).map(function(t) {
      return '<button class="bookmark-tag" data-tag="' + escapeHtml(t) + '">#' + escapeHtml(t) + '</button>';
    }).join('');
    var noteHtml = bm.note ? '<div class="bookmark-note">' + escapeHtml(bm.note) + '</div>' : '';
    return '<div class="bookmark-card" data-id="' + bm.id + '">' +
      '<div class="bookmark-card-top"><div class="bookmark-title">' + ht + '</div>' +
      '<div class="bookmark-actions">' +
      '<button class="bookmark-action-btn bookmark-copy" title="Copy text"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>' +
      '<button class="bookmark-action-btn bookmark-goto" title="Go to chat"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></button>' +
      '<button class="bookmark-action-btn bookmark-delete" title="Delete"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>' +
      '</div></div>' +
      '<div class="bookmark-preview">' + hp + '</div>' + noteHtml +
      '<div class="bookmark-card-bottom"><div class="bookmark-tags-row">' +
      '<span class="platform-dot platform-dot-' + bm.platform + '"></span>' + tagsHtml +      '</div><div class="bookmark-time">' + time + '</div></div></div>';
  }

  function highlightSearch(text) {
    var query = searchInput.value.trim();
    if (!query) return text;
    try {
      var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return text.replace(new RegExp('(' + escaped + ')', 'gi'), '<span class="search-highlight">$1</span>');
    } catch (e) { return text; }
  }

  function groupByDate(bookmarks) {
    var groups = {};
    var today = new Date().toDateString();
    var yesterday = new Date(Date.now() - 86400000).toDateString();
    bookmarks.forEach(function(b) {
      var d = new Date(b.createdAt).toDateString();
      var label;
      if (d === today) label = 'Today';
      else if (d === yesterday) label = 'Yesterday';
      else label = new Date(b.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (!groups[label]) groups[label] = [];
      groups[label].push(b);
    });
    return groups;
  }
  // ══════════════════════════════════════════════════════════════
  // NAVIGATE TO BOOKMARK — using Chrome Text Fragments API
  // Instead of fighting platform auto-scroll with JS, we let the
  // BROWSER natively scroll to and highlight the text by using
  // the #:~:text= fragment directive in the URL.
  // See: https://web.dev/articles/text-fragments
  // ══════════════════════════════════════════════════════════════
  function navigateToBookmark(bookmark) {
    var baseUrl = (bookmark.url || '').split('#')[0];

    // Build the text fragment
    var textFrag = bookmark.textFragment;
    if (!textFrag && bookmark.textAnchor) {
      textFrag = generateTextFragment(bookmark.textAnchor);
    }

    var navUrl = baseUrl;
    if (textFrag) {
      navUrl = baseUrl + '#:~:text=' + textFrag;
    }

    // Open in a new tab with text fragment for browser-native scroll
    chrome.tabs.create({ url: navUrl, active: true }, function(newTab) {
      // ALSO send a JS fallback scroll after the page loads
      // This handles cases where text fragments fail (same URL, etc.)
      function onUpdated(tabId, info) {
        if (tabId === newTab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);
          // Wait for platform to finish its own scrolling, then override
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

  function generateTextFragment(text) {
    var clean = (text || '').trim();
    if (!clean) return '';    var words = clean.split(/\s+/);
    if (words.length <= 12) {
      // Short text — exact match (first 8 words)
      return encodeURIComponent(words.slice(0, 8).join(' '));
    } else {
      // Long text — range match: first 6 words,last 6 words
      var start = encodeURIComponent(words.slice(0, 6).join(' '));
      var end = encodeURIComponent(words.slice(-6).join(' '));
      return start + ',' + end;
    }
  }

  function deleteBookmark(id) {
    allBookmarks = allBookmarks.filter(function(b) { return b.id !== id; });
    chrome.storage.local.set({ bookmarks: allBookmarks }, function() {
      bookmarkCount.textContent = allBookmarks.length;
      renderTagCloud(); renderBookmarks();
    });
  }

  // Export
  document.getElementById('export-btn').addEventListener('click', function() {
    var data = JSON.stringify(allBookmarks, null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'chatmark-bookmarks-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click(); URL.revokeObjectURL(url);
  });
  // Import
  document.getElementById('import-btn').addEventListener('click', function() {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var imported = JSON.parse(ev.target.result);
        if (Array.isArray(imported)) {
          var existingIds = {};
          allBookmarks.forEach(function(b) { existingIds[b.id] = true; });
          var newOnes = imported.filter(function(b) { return !existingIds[b.id]; });
          allBookmarks = newOnes.concat(allBookmarks);
          chrome.storage.local.set({ bookmarks: allBookmarks }, function() {
            bookmarkCount.textContent = allBookmarks.length;
            renderTagCloud(); renderBookmarks();
          });
        }
      } catch (err) { alert('Invalid bookmark file'); }
    };
    reader.readAsText(file);
  });

  // Search
  searchInput.addEventListener('input', function() {
    clearBtn.style.display = searchInput.value ? 'block' : 'none';
    renderBookmarks();
  });  clearBtn.addEventListener('click', function() {
    searchInput.value = ''; clearBtn.style.display = 'none';
    renderBookmarks(); searchInput.focus();
  });

  // Platform filter chips
  document.querySelectorAll('.filter-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeFilter = chip.dataset.platform;
      renderBookmarks();
    });
  });

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // Initialize
  loadBookmarks();
  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.bookmarks) {
      allBookmarks = changes.bookmarks.newValue || [];
      bookmarkCount.textContent = allBookmarks.length;
      renderTagCloud(); renderBookmarks();
    }
  });
})();