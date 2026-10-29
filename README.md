# Questline

> A journal that levels you up: turn your bucket list into a skill tree, and every entry is proof you've grown.

Questline is an installable Progressive Web App (PWA). Once it's installed on Android it works fully offline. There's no build step, no framework and no server: it's plain HTML, CSS and JavaScript.

## What's in it

| Feature | Where |
|---|---|
| Skill, Experience and Knowledge nodes with categories, prerequisites and Locked / Available / Unlocked status | **Tree** tab |
| Visual skill tree with connecting lines, glowing available nodes and multiple trees | **Tree** tab |
| Journal entries (text, date, photos, 5-point mood, linked nodes) that unlock nodes or level up skills | **+** button |
| Unlock and level-up animations, with haptics on Android | after saving an entry |
| Journal feed, filterable by category, node and date range | **Journal** tab |
| Calculated stats, radar chart, character level and earned titles | **Character** tab |
| Starter templates during onboarding (pick 1–3), plus more from Settings | first launch / Settings |
| Monthly and yearly Character Recap, and "On this day" | Home → clock icon |
| Optional shared trees (off by default) | Settings → Shared trees |
| Dark and light mode, PIN lock, gentle weekly reminder, backup and restore | Settings |

### Game rules (all calculated, never typed in)
- **Experience / Knowledge**: unlocked by the first linked journal entry.
- **Skill**: Levels 1–5 need 1, 3, 6, 10 and 15 linked entries.
- **Stats**: each Experience/Knowledge unlock adds +3 to its category's stat, and each Skill level adds +2. Life Admin points are split between Mind and Career.
- **Character level** comes from total unlocks (every skill level counts as one). Levels 2, 3, 4, 5… need 2, 5, 9, 14… unlocks.
- **Title** comes from your strongest stat: for example Scholar, Adventurer or Maker.

These rules live in `js/logic.js` if you want to tune them.

---

## Host it free on GitHub Pages

You need a free GitHub account. Everything below can be done in the browser, so you don't need to install anything.

1. **Create a repository.** Go to <https://github.com/new>. Name it `questline`, set it to **Public** (the free plan only serves Pages from public repos), and click **Create repository**.
2. **Upload the files.** On the new repo page, click **uploading an existing file**. Unzip `questline.zip` on your computer, then drag *the contents* of the `questline` folder into the upload area: `index.html`, `styles.css`, `sw.js`, `manifest.webmanifest`, `README.md` and the `js/` and `icons/` folders. `index.html` must end up at the top level of the repo, not inside a subfolder. Click **Commit changes**.
3. **Turn on Pages.** Go to **Settings → Pages**. Under *Build and deployment*, set **Source** to *Deploy from a branch*, choose branch **main** and folder **/ (root)**, then click **Save**.
4. **Wait about a minute**, then refresh the Pages settings screen. It will show your live address: `https://<your-username>.github.io/questline/`.
5. **Install it on Android.** Open that address in **Chrome** on your phone. Tap the **Install** banner on the home screen, or tap **⋮ → Install app** (on some phones it says *Add to Home screen*). Questline now opens like a normal app and works offline.

> The app uses relative paths, so it works under `/questline/` or any other repo name. HTTPS is required for installing and for the service worker, and GitHub Pages provides it automatically.

### Updating the app later
1. Edit or re-upload the changed files in the repo.
2. **Bump `VERSION`** at the top of `sw.js` (for example `questline-v1.0.1`). This tells installed copies to fetch the new files.
3. The next time the app opens online it updates in the background, and the version after that runs the new code. Your journal data is untouched.

### Prefer the command line?
```bash
cd questline
git init && git add . && git commit -m "Questline"
git branch -M main
git remote add origin https://github.com/<your-username>/questline.git
git push -u origin main
```
Then complete step 3 above.

---

## Privacy and data: important to know

- **Everything is stored on your device** (IndexedDB in Chrome). Nothing is uploaded, and there are no accounts. That's what makes it private by default and fully offline.
- **Back up regularly:** Settings → Backup → Export downloads one file that includes your photos. If you clear Chrome's site data or uninstall the app, the journal on that phone is deleted. Restore puts everything back on any device.
- The **PIN lock** is a privacy screen to stop casual snooping. It is not encryption.
- **Photos** are resized to 1600px JPEGs to save space.

### Reminders
The weekly "What did you do this week?" prompt does two things:
1. It shows a gentle card on the Home screen if you haven't written in seven days.
2. On an **installed** app in Chrome on Android, it also asks for a notification through *Periodic Background Sync*. Chrome decides when this runs based on how often you use the app, so treat it as best-effort. It never mentions streaks and stays quiet if you've written recently.

### Shared trees (optional)
Turn this on in Settings. In a tree, open **Manage → Make this a shared tree → Send tree file** to share the file through WhatsApp, email or any other app. Your friend imports it in **Settings → Shared trees → Import**, then sends theirs back. A shared node unlocks for everyone when anyone writes proof, but each person's stats only grow from their own entries. Only that tree's nodes and the entries linked to it are included in the file.

---

## Going further: real accounts and cloud sync
The brief asked for accounts and cloud sync, but those need a backend, and GitHub Pages only hosts static files. Questline is built *local-first* so a backend can be added later without a rewrite:

- **Supabase** (free tier) works well: Auth for secure login, Postgres with Row Level Security so each user can only read their own rows, and Storage for photos.
- Keep IndexedDB as the offline cache. Then sync the `trees`, `nodes` and `entries` arrays (each already has an `id` and `updatedAt`), and upload photo Blobs to a private storage bucket.
- With live sync in place, shared trees become a `tree_members` table instead of swapped files.

## File map
```
index.html            app shell + tab bar
styles.css            all styling (light/dark tokens at the top)
manifest.webmanifest  install metadata (name, icons, colours, shortcuts)
sw.js                 service worker: offline cache + weekly reminder
js/store.js           IndexedDB + photo handling
js/templates.js       the five starter packs
js/logic.js           game rules: unlocks, levels, stats, titles, tree layout
js/ui.js              icons, radar chart, sheets, celebrations
js/views.js           every screen
js/app.js             state, routing, saving, backup, sharing, PIN, reminders
icons/                app icons (incl. Android maskable)
```

## Run locally
```bash
cd questline
python3 -m http.server 8000
# open http://localhost:8000
```
