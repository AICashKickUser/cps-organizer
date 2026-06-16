# Personal Organizer — Evidence & Activity Timeline

**100% private. All your data stays on YOUR device.** Nothing is ever sent to any server.

## How This App Works

- Your timeline entries, photos, files, and notes are stored in your **browser's IndexedDB** — a local database built into every phone/tablet/computer
- A **PIN lock** protects your data from anyone who picks up your device
- Works **offline** — once loaded, it caches itself and runs without internet
- **Installs like a native app** on your phone/iPad home screen (PWA)

---

## Deploy to GitHub Pages (FREE, Private)

### Step 1: Create a Private GitHub Repository

1. Go to **github.com** and sign in (or create a free account)
2. Click the **+** icon (top right) → **New repository**
3. Name it anything (e.g. `my-organizer`)
4. Set it to **Private** (so nobody can find it)
5. Do NOT initialize with README — leave all checkboxes unchecked
6. Click **Create repository**

### Step 2: Upload Your Code

**Option A: Using the GitHub website (easiest, no terminal needed)**

1. After creating the repo, click **"uploading an existing file"** on the repo page
2. Drag and drop ALL files and folders from this project into the browser
3. Make sure you include:
   - `.github/` folder (for auto-deploy)
   - `src/` folder (your app code)
   - `public/` folder (icons, manifest, service worker)
   - `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`
   - `.gitignore`
4. Add a commit message like "Initial commit"
5. Click **Commit changes**

**Option B: Using Git terminal (if you're comfortable with terminal)**

```bash
# Open your terminal in this project folder
cd personal-organizer

# Initialize git
git init
git branch -M main
git add .
git commit -m "Initial commit"

# Add your GitHub repo as remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (tab at the top)
3. On the left sidebar, click **Pages**
4. Under "Build and deployment", set:
   - **Source**: GitHub Actions
5. GitHub will now automatically build and deploy your app every time you push code

### Step 4: Wait for Deployment

1. Go to the **Actions** tab in your repo
2. You'll see a workflow running called "Deploy to GitHub Pages"
3. Wait 2-3 minutes for it to complete (green checkmark)
4. Your app URL will be: `https://YOUR_USERNAME.github.io/my-organizer/`

### Step 5: Install on Your Phone/iPad (PWA)

**iPhone/iPad (Safari):**
1. Open Safari and go to your GitHub Pages URL
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it "Organizer" and tap **Add**
5. It now appears on your home screen like a regular app!

**Android (Chrome):**
1. Open Chrome and go to your GitHub Pages URL
2. Tap the **three-dot menu** (top right)
3. Tap **"Add to Home Screen"** or **"Install App"**
4. It now appears on your home screen!

**Important:** The first time you open the app, set up your PIN. This PIN only exists on THIS device — if you clear your browser data, you'll need to set a new PIN.

---

## Security & Privacy

- **No server database** — all data lives in your browser
- **PIN lock** with 5-attempt lockout (5 minute cooldown)
- **No analytics, no tracking** — the code is yours to inspect
- **Private GitHub repo** — only you can see the source code
- **HTTPS** — GitHub Pages serves over encrypted connections

---

## Running Locally (Optional)

If you want to test on your computer before deploying:

```bash
# Install Node.js from nodejs.org (version 20 or later)

# Open terminal in this folder
npm install
npm run dev

# Open http://localhost:3000 in your browser
```

---

## Project Structure

```
personal-organizer/
├── .github/workflows/deploy.yml   # Auto-deploy to GitHub Pages
├── public/
│   ├── icon-192.png               # App icon (small)
│   ├── icon-512.png               # App icon (large)
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker (offline support)
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── globals.css            # Tailwind CSS styles
│   │   ├── layout.tsx             # Main layout with PWA setup
│   │   └── page.tsx               # App entry point
│   ├── components/
│   │   ├── pin-lock.tsx           # PIN lock screen
│   │   ├── organizer/             # Timeline UI components
│   │   │   ├── entry-card.tsx     # Timeline entry card
│   │   │   ├── entry-form.tsx     # Create/edit entry form
│   │   │   ├── entry-detail.tsx   # Entry detail view
│   │   │   ├── filter-bar.tsx     # Search & filter controls
│   │   │   ├── image-lightbox.tsx # Fullscreen image viewer
│   │   │   ├── stats-bar.tsx      # Entry statistics
│   │   │   └── timeline-view.tsx  # Main timeline display
│   │   └── ui/                    # Reusable UI components
│   ├── hooks/use-toast.ts         # Toast notification hook
│   ├── hooks/use-mobile.ts        # Mobile detection hook
│   ├── lib/
│   │   ├── client-db.ts           # IndexedDB database (all your data)
│   │   ├── types.ts               # TypeScript types
│   │   └── utils.ts               # Utility functions
│   └── store/
│       └── organizer-store.ts     # Zustand state management
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── postcss.config.mjs
```

---

## Backing Up Your Data

Since all data is in your browser:

1. **Export regularly** — use the export feature in the app to download JSON/CSV backups
2. **Don't clear browser data** on the device where you use the app
3. If you switch devices, export from old device and re-enter on new device

---

## What If I Want My Own Domain?

You can use a custom domain (e.g. `myorganizer.com`) with GitHub Pages:

1. In your repo Settings → Pages → Custom domain
2. Enter your domain
3. Add a CNAME record at your domain registrar pointing to `YOUR_USERNAME.github.io`

---

## License

This is your personal tool. Use it however you need to for your case.