# ChatNugget — Save the Golden Nuggets from Your AI Conversations

> The first browser extension that lets you highlight, bookmark, and search specific sections *within* AI chat conversations — across Claude, ChatGPT, and Gemini.

---

## The Problem

You're deep in an AI conversation. The model gives you a brilliant response — a framework, a code pattern, a reframing of your approach. You think *"I'll come back to this."*

You never do. Because there's no way to.

You can bookmark the chat. **You can't bookmark the moment.**

Three weeks later, you're scrolling through a dozen conversations looking for that one paragraph. Was it in Claude? ChatGPT? You've had 40 more chats since then.

**ChatNugget fixes this.**

---

## Features

- **Text-level bookmarking** — Highlight the exact sentence or paragraph that matters, not just the whole chat
- **Cross-platform** — Works on Claude, ChatGPT, and Gemini
- **Full-text search** — Search across titles, text, notes, and tags with highlighted matches
- **Platform filters** — See only Claude bookmarks, or ChatGPT, or all of them together
- **Tag system** — Organize with tags; a clickable tag cloud appears automatically
- **Pin bookmarks** — Pin your most important nuggets to the top of the list
- **Deep-link navigation** — Uses Chrome's [Text Fragments API](https://web.dev/articles/text-fragments) + JS fallback to scroll you right back to the exact spot
- **Keyboard shortcut** — Press `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac) to instantly bookmark selected text
- **Badge count** — See your total nuggets count on the extension icon
- **Date grouping** — Bookmarks grouped by Today, Yesterday, and older dates
- **Notes** — Add personal notes to any bookmark explaining why it matters
- **Export/Import** — Back up your nuggets as JSON, or transfer between browsers
- **Zero build step** — Just unzip and load. No npm, no build tools, no config

---

## Supported Platforms

| Platform | URL | Status |
|----------|-----|--------|
| Claude | `claude.ai` | Supported |
| ChatGPT | `chatgpt.com` / `chat.openai.com` | Supported |
| Gemini | `gemini.google.com` | Supported |

---

## Installation

### From source (Developer Mode)

1. **Clone this repo**
```bash
git clone https://github.com/Madeniyi23/chatmark-extension.git
```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions`
   - Enable **Developer mode** (toggle in top right)

3. **Load the extension**
   - Click **Load unpacked**
   - Select the cloned folder

4. **Start bookmarking!**
   - Visit any supported AI chat
   - Select text and click the purple **Bookmark** button
   - Or press `Ctrl+Shift+B` to bookmark instantly

---

## Usage

**Bookmarking:**
1. Open any AI chat on Claude, ChatGPT, or Gemini
2. Select any text in a conversation
3. Click the purple **Bookmark** button that appears (or press `Ctrl+Shift+B`)
4. Add a title, tags, and optional note
5. Click **Save Nugget** (or press `Ctrl+Enter`)

**Finding nuggets:**
1. Click the ChatNugget extension icon
2. Search, filter by platform, or click a tag
3. Click **Go to chat** to jump back to the exact spot

**Pinning:**
- Hover over any bookmark and click the star icon to pin it to the top

---

## Project Structure

```
chatmark-extension/
├── manifest.json          # Extension config (v3)
├── content.js             # Text selection + bookmark dialog + scroll logic
├── content.css            # Styles for floating button, dialog, highlights
├── background.js          # Service worker: context menu, badge, shortcuts
├── popup/
│   ├── popup.html         # Bookmark manager UI
│   ├── popup.js           # Search, filter, pin, navigate, export/import
│   └── popup.css          # Popup styles
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
└── LICENSE
```

---

## How It Works

ChatNugget uses a **hybrid scroll-to-text** approach:

1. **Chrome Text Fragments API** — Appends `#:~:text=` fragments to the URL, which tells Chrome to scroll to and highlight the matching text natively
2. **JavaScript fallback** — Uses a TreeWalker-based DOM search with retry logic (8 attempts with increasing delays) to fight platform auto-scroll behavior
3. **Re-scroll defense** — After finding the text, re-scrolls at 1s and 3s to counteract AI platforms that auto-scroll to the bottom

All bookmarks are stored locally via `chrome.storage.local`. No data leaves your browser.

---

## What's New in v2.0.0

- Renamed to **ChatNugget**
- **Pin bookmarks** to the top of your list
- **Keyboard shortcut** (`Ctrl+Shift+B`) for instant bookmarking
- **Badge count** on the extension icon
- Removed Copilot (not yet stable), focused on Claude, ChatGPT, Gemini
- Cleaner codebase and improved UI

---

## Contributing

Pull requests welcome! If you have ideas, open an issue or submit a PR.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built by [Madeniyi23](https://github.com/Madeniyi23)** — because every AI conversation has nuggets worth saving.
