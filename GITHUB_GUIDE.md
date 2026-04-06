# Step-by-Step: Uploading ChatMark to GitHub

## Prerequisites
- A GitHub account (github.com)
- Git installed on your PC (download from https://git-scm.com/downloads if needed)

---

## Step 1: Check if Git is installed

Open **Command Prompt** (search "cmd" in Windows) and type:
```
git --version
```
If you see a version number (e.g. `git version 2.x.x`), you're good.
If not, download and install Git from https://git-scm.com/downloads

---

## Step 2: Create a new repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `chatmark-extension`
   - **Description:** `Bookmark moments in your AI conversations — across Claude, ChatGPT, Gemini & Copilot`
   - **Visibility:** Public
   - Do NOT check "Add a README" (we already have one)
   - Do NOT check "Add .gitignore" (we already have one)
   - Select **MIT License** under "Choose a license" (or skip — we have one)
3. Click **Create repository**
4. You'll see a page with setup instructions — keep this open
---

## Step 3: Set up Git on your machine (first time only)

Open Command Prompt and run these two commands with YOUR info:
```
git config --global user.name "Muyiwa Adeniyi"
git config --global user.email "adeniyi.muyiwa@gmail.com"
```

---

## Step 4: Initialize and push the repo

Open Command Prompt and run these commands ONE BY ONE:

```
cd "C:\Users\PC\Claude - ChatMark"
```

```
git init
```

```
git add .
```

```
git commit -m "Initial release: ChatMark v1.2.0 — bookmark moments in AI conversations"
```

```
git branch -M main
```
Now connect to YOUR GitHub repo (replace YOUR_USERNAME with your GitHub username):
```
git remote add origin https://github.com/YOUR_USERNAME/chatmark-extension.git
```

Push it:
```
git push -u origin main
```

**If prompted to log in:** A browser window will open asking you to authorize Git with GitHub. Click "Authorize" and you're done.

---

## Step 5: Verify

1. Go to `https://github.com/YOUR_USERNAME/chatmark-extension`
2. You should see all your files listed
3. The README.md should render beautifully below the file list
4. Share this URL with anyone — they can install ChatMark from your repo

---

## Optional: Add screenshots

To make the README even more compelling, add screenshots:

1. Take screenshots of ChatMark in action (the bookmark button, the dialog, the popup)
2. Save them in the project folder (e.g., `screenshot-bookmark.png`, `screenshot-popup.png`)
3. Reference them in the README by replacing `preview-banner.png`:
   ```markdown
   ![ChatMark Bookmark Button](screenshot-bookmark.png)
   ```
4. Commit and push again:
   ```
   cd "C:\Users\PC\Claude - ChatMark"
   git add .
   git commit -m "Add screenshots"
   git push
   ```
---

## Troubleshooting

**"fatal: not a git repository"**
Make sure you ran `git init` in the correct folder. Run `cd "C:\Users\PC\Claude - ChatMark"` first.

**"remote origin already exists"**
Run: `git remote remove origin` then try the `git remote add` command again.

**"failed to push some refs"**
Run: `git pull origin main --allow-unrelated-histories` then try `git push` again.

**Authentication issues**
GitHub no longer accepts passwords via command line. When prompted, use the browser-based authentication flow, or create a Personal Access Token at https://github.com/settings/tokens

---

## What's Next?

After the repo is live:
1. Share the GitHub link on LinkedIn (see the LinkedIn post draft in this folder)
2. Gather feedback from early users
3. When ready, publish to Chrome Web Store (see below)

### Chrome Web Store Publishing (for later)
1. Go to https://chrome.google.com/webstore/devconsole
2. Pay the one-time $5 developer fee
3. Click "New Item" → upload a ZIP of the extension folder
4. Fill in the listing: description, screenshots, category ("Productivity")
5. Submit for review (usually takes 1-3 business days)