'use strict';
/* App state, persistence, routing and data actions. */

let S = null;          // the whole journal (persisted to IndexedDB)
let D = null;          // derived cache
let NODE_MAP = new Map();
let LOCKED = false;
let deferredInstall = null;

function freshState() {
  return {
    v: 1,
    profile: { id: uid(), name: '', onboarded: false, createdAt: Date.now() },
    settings: { theme: 'system', social: false, reminders: false, pinHash: null, pinSalt: null },
    trees: [], nodes: [], entries: [],
    ui: { lastTree: null, installDismissed: false }
  };
}

const nodeById = (id) => NODE_MAP.get(id);
const treeById = (id) => S.trees.find((t) => t.id === id);
const isOwn = (e) => !e.authorId || e.authorId === S.profile.id;

function invalidate() { D = null; NODE_MAP = new Map(S.nodes.map((n) => [n.id, n])); }
function persist() {
  invalidate();
  kvSet('state', S).catch((err) => toast('Could not save: ' + err.message));
  syncReminderKV();
}
function syncReminderKV() {
  const last = S.entries.filter(isOwn).reduce((m, e) => Math.max(m, e.createdAt || 0), 0);
  kvSet('reminder', { enabled: !!S.settings.reminders, lastEntryAt: last }).catch(() => {});
}

/* Node status comes from ALL entries (shared trees unlock together);
   stats + character level come only from YOUR entries. */
function getD() {
  if (D) return D;
  const all = derive(S.entries, S.nodes);
  const own = derive(S.entries.filter(isOwn), S.nodes);
  D = { info: all.info, events: all.events, ownEvents: own.events, stats: own.stats, total: own.total, level: own.level };
  return D;
}
function status(n) {
  const i = getD().info.get(n.id);
  if (i && i.unlocked) return n.type === 'skill' && i.level >= 5 ? 'mastered' : 'unlocked';
  const ps = (n.prereqs || []).map(nodeById).filter(Boolean);
  return ps.every((p) => getD().info.get(p.id).unlocked) ? 'available' : 'locked';
}
const canWriteProof = (n) => status(n) !== 'locked';

/* ---------- Theme ---------- */
function applyTheme() {
  const t = S.settings.theme;
  if (t === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  try { localStorage.setItem('ql-theme', t); } catch (e) {}
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('#meta-theme').setAttribute('content', dark ? '#121019' : '#F4EFE6');
}

/* ---------- Routing ---------- */
function parseHash() {
  const h = location.hash.slice(1) || '/';
  const [path, qs] = h.split('?');
  return { parts: path.split('/').filter(Boolean), q: new URLSearchParams(qs || '') };
}
let _lastPath = null;
function render() {
  if (LOCKED) { renderLock(); return; }
  const r = parseHash();
  if (!S.profile.onboarded && r.parts[0] !== 'onboard') { location.replace('#/onboard'); return; }
  const [a, b, c] = r.parts;
  let out, tab = '';
  if (!a) { out = vHome(); tab = 'home'; }
  else if (a === 'onboard') out = vOnboard();
  else if (a === 'tree') { out = vTree(r.q); tab = 'tree'; }
  else if (a === 'node' && b === 'new') { out = vNodeEdit(null, r.q); tab = 'tree'; }
  else if (a === 'node' && c === 'edit') { out = vNodeEdit(b, r.q); tab = 'tree'; }
  else if (a === 'node') { out = vNode(b); tab = 'tree'; }
  else if (a === 'entry' && b === 'new') { out = vEntryEdit(null, r.q); tab = 'new'; }
  else if (a === 'entry' && c === 'edit') { out = vEntryEdit(b, r.q); tab = 'journal'; }
  else if (a === 'entry') { out = vEntry(b); tab = 'journal'; }
  else if (a === 'journal') { out = vJournal(); tab = 'journal'; }
  else if (a === 'sheet') { out = vSheet(); tab = 'sheet'; }
  else if (a === 'recap') { out = vRecap(r.q); tab = 'sheet'; }
  else if (a === 'settings') { out = vSettings(); tab = 'home'; }
  else { out = vNotFound(); }
  if (typeof out === 'string') out = { html: out };

  const v = $('#view');
  v.innerHTML = out.html;
  document.body.classList.toggle('no-tabs', !!out.noTabs || a === 'onboard');
  $$('#tabbar a').forEach((el) => el.classList.toggle('active', el.dataset.tab === tab));
  hydratePhotos(v);
  const path = r.parts.join('/');
  if (path !== _lastPath) { window.scrollTo(0, 0); _lastPath = path; }
  out.mount && out.mount(v);
}
function go(hash, replace = false) {
  if (replace) location.replace(hash); else location.hash = hash;
}
function goBack(fallback = '#/') {
  if (history.length > 1 && document.referrer !== undefined && sessionStorage.getItem('ql-nav') === '1') history.back();
  else go(fallback, true);
}

/* Global click delegation for simple actions. */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const act = el.dataset.action;
  if (act === 'back') { e.preventDefault(); goBack(el.dataset.fallback || '#/'); }
  if (act === 'photo') { e.preventDefault(); lightbox(el.dataset.id); }
});

/* ---------- Data actions ---------- */
function installPack(pack, treeIdOverride) {
  const tree = { id: uid(), name: pack.tree, pack: pack.id, createdAt: Date.now(), shared: false, members: [] };
  S.trees.push(tree);
  const ids = Object.fromEntries(pack.nodes.map(([k]) => [k, uid()]));
  const now = Date.now();
  pack.nodes.forEach(([k, title, type, category, description, pre], i) => {
    S.nodes.push({ id: ids[k], treeId: treeIdOverride || tree.id, title, type, category, description, prereqs: pre.map((p) => ids[p]).filter(Boolean), createdAt: now + i, updatedAt: now + i });
  });
  return tree;
}

function deleteNode(id) {
  S.nodes = S.nodes.filter((n) => n.id !== id);
  S.nodes.forEach((n) => { n.prereqs = (n.prereqs || []).filter((p) => p !== id); });
  S.entries.forEach((e) => { e.nodeIds = (e.nodeIds || []).filter((x) => x !== id); });
  persist();
}
function deleteTree(id) {
  const ids = new Set(S.nodes.filter((n) => n.treeId === id).map((n) => n.id));
  S.nodes = S.nodes.filter((n) => !ids.has(n.id));
  S.entries.forEach((e) => { e.nodeIds = (e.nodeIds || []).filter((x) => !ids.has(x)); });
  S.trees = S.trees.filter((t) => t.id !== id);
  if (S.ui.lastTree === id) S.ui.lastTree = null;
  persist();
}
async function deleteEntry(id) {
  const e = S.entries.find((x) => x.id === id);
  if (!e) return;
  for (const p of e.photoIds || []) { await photoDel(p).catch(() => {}); forgetPhotoURL(p); }
  S.entries = S.entries.filter((x) => x.id !== id);
  persist();
}

/* Save an entry, then work out what it unlocked and celebrate. */
async function saveEntry(draft) {
  const before = getD();
  const beforeKeys = new Set(before.events.map(evKey));
  const beforeLevel = before.level.level;
  const beforeTitle = titleFor(before.stats).title;

  const photoIds = [...draft.keepPhotoIds];
  for (const p of draft.newPhotos) { const id = uid(); await photoPut(id, p.blob); photoIds.push(id); }
  for (const id of draft.removedPhotoIds) { await photoDel(id).catch(() => {}); forgetPhotoURL(id); }

  const now = Date.now();
  let entry = draft.id ? S.entries.find((e) => e.id === draft.id) : null;
  if (entry) {
    Object.assign(entry, { text: draft.text, date: draft.date, mood: draft.mood, nodeIds: draft.nodeIds, photoIds, updatedAt: now });
  } else {
    entry = { id: uid(), text: draft.text, date: draft.date, mood: draft.mood, nodeIds: draft.nodeIds, photoIds, createdAt: now, updatedAt: now, authorId: S.profile.id, authorName: S.profile.name };
    S.entries.push(entry);
  }
  persist();
  requestPersistentStorage();

  const after = getD();
  const items = after.events
    .filter((ev) => !beforeKeys.has(evKey(ev)))
    .sort((a, b) => a.level - b.level)
    .map((ev) => ({ kind: ev.kind, node: nodeById(ev.nodeId), level: ev.level }));
  const t = titleFor(after.stats);
  if (after.level.level > beforeLevel) items.push({ kind: 'char', level: after.level.level, title: t.title });
  else if (t.title !== beforeTitle && t.title !== 'Wanderer') items.push({ kind: 'title', title: t.title, stat: t.stat });

  go('#/entry/' + entry.id, true);
  await celebrate(items);
  if (!items.length) toast(draft.id ? 'Entry updated' : 'Entry saved');
}

/* ---------- Backup ---------- */
async function exportBackup() {
  const photos = {};
  for (const id of await photoKeys()) { const b = await photoGet(id); if (b) photos[id] = await blobToDataURL(b); }
  const data = { kind: 'questline-backup', version: 1, exportedAt: new Date().toISOString(), state: S, photos };
  download(`questline-backup-${todayISO()}.json`, JSON.stringify(data));
  S.settings.lastBackup = Date.now();
  persist();
  toast('Backup downloaded');
}
async function importBackup() {
  const f = await pickFile('application/json,.json');
  if (!f) return;
  let data;
  try { data = JSON.parse(await f.text()); } catch (e) { toast('That file is not a Questline backup'); return; }
  if (data.kind !== 'questline-backup' || !data.state) { toast('That file is not a Questline backup'); return; }
  if (!(await confirmDialog('Replace everything on this device with this backup?', { ok: 'Restore' }))) return;
  await clearAllData();
  for (const [id, url] of Object.entries(data.photos || {})) await photoPut(id, await dataURLToBlob(url));
  S = Object.assign(freshState(), data.state);
  persist();
  applyTheme();
  toast('Backup restored');
  go('#/', true);
  render();
}

/* ---------- Social: shared trees via file ---------- */
async function exportSharedTree(treeId, includePhotos) {
  const tree = treeById(treeId);
  const nodes = S.nodes.filter((n) => n.treeId === treeId);
  const ids = new Set(nodes.map((n) => n.id));
  const entries = [];
  const photos = {};
  for (const e of S.entries) {
    const linked = (e.nodeIds || []).filter((x) => ids.has(x));
    if (!linked.length) continue;
    const copy = { ...e, nodeIds: linked, photoIds: includePhotos ? e.photoIds || [] : [], authorId: e.authorId || S.profile.id, authorName: e.authorName || S.profile.name };
    entries.push(copy);
    if (includePhotos) for (const p of copy.photoIds) { const b = await photoGet(p); if (b) photos[p] = await blobToDataURL(b); }
  }
  const data = { kind: 'questline-tree', version: 1, exportedAt: new Date().toISOString(), from: { id: S.profile.id, name: S.profile.name }, tree, nodes, entries, photos };
  const name = `questline-${tree.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
  const file = new File([JSON.stringify(data)], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `Questline: ${tree.name}`, text: `Our shared Questline tree "${tree.name}". Import it in Questline → Settings → Shared trees.` }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  download(name, JSON.stringify(data));
}
async function importSharedTree() {
  const f = await pickFile('application/json,.json');
  if (!f) return;
  let data;
  try { data = JSON.parse(await f.text()); } catch (e) { toast('That file is not a shared tree'); return; }
  if (data.kind !== 'questline-tree' || !data.tree) { toast('That file is not a shared tree'); return; }
  let tree = treeById(data.tree.id);
  if (!tree) { tree = { ...data.tree, shared: true, members: data.tree.members || [] }; S.trees.push(tree); }
  tree.shared = true;
  const fromName = data.from && data.from.name;
  if (fromName && data.from.id !== S.profile.id && !tree.members.includes(fromName)) tree.members.push(fromName);
  for (const n of data.nodes || []) {
    const ex = S.nodes.find((x) => x.id === n.id);
    if (!ex) S.nodes.push({ ...n, treeId: tree.id });
    else if ((n.updatedAt || 0) > (ex.updatedAt || 0)) Object.assign(ex, n, { treeId: tree.id });
  }
  invalidate();
  let added = 0;
  for (const e of data.entries || []) {
    if (e.authorId === S.profile.id) continue; // our own entries already live here
    const nodeIds = (e.nodeIds || []).filter((id) => nodeById(id));
    const ex = S.entries.find((x) => x.id === e.id);
    if (ex) Object.assign(ex, e, { nodeIds });
    else { S.entries.push({ ...e, nodeIds }); added++; }
  }
  for (const [id, url] of Object.entries(data.photos || {})) if (!(await photoGet(id))) await photoPut(id, await dataURLToBlob(url));
  persist();
  toast(`Imported "${tree.name}"${added ? ` with ${added} new entr${added === 1 ? 'y' : 'ies'}` : ''}`);
  go('#/tree?t=' + tree.id);
}

/* ---------- Privacy lock ---------- */
async function hashPin(pin, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function renderLock() {
  document.body.classList.add('no-tabs');
  let pin = '';
  const draw = () => {
    $('#view').innerHTML = `<div class="lock-screen">${LOGO}<h1 class="serif">Questline</h1><p class="muted">Enter your PIN</p>
      <div class="pin-dots">${[0, 1, 2, 3, 4, 5].slice(0, Math.max(4, pin.length)).map((i) => `<i class="${i < pin.length ? 'on' : ''}"></i>`).join('')}</div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k) => k === '' ? '<span></span>' : `<button data-k="${k}">${k}</button>`).join('')}</div>
      <button class="btn ghost small" id="pin-go">Unlock</button></div>`;
    $$('.keypad button').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.k;
      if (k === '⌫') pin = pin.slice(0, -1); else if (pin.length < 6) pin += k;
      draw();
      if (pin.length >= 4) tryUnlock(false);
    }));
    $('#pin-go').addEventListener('click', () => tryUnlock(true));
  };
  const tryUnlock = async (explicit) => {
    const h = await hashPin(pin, S.settings.pinSalt);
    if (h === S.settings.pinHash) { LOCKED = false; document.body.classList.remove('no-tabs'); render(); }
    else if (explicit || pin.length === 6) { pin = ''; draw(); toast('That PIN did not match'); }
  };
  draw();
}

/* ---------- Reminders ---------- */
async function setReminders(on) {
  if (on) {
    if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    try {
      const reg = await navigator.serviceWorker.ready;
      if ('periodicSync' in reg) {
        const p = await navigator.permissions.query({ name: 'periodic-background-sync' }).catch(() => ({ state: 'denied' }));
        if (p.state === 'granted') await reg.periodicSync.register('questline-weekly', { minInterval: 7 * 24 * 60 * 60 * 1000 });
      }
    } catch (e) { /* in-app prompt still works */ }
  } else {
    try { const reg = await navigator.serviceWorker.ready; if ('periodicSync' in reg) await reg.periodicSync.unregister('questline-weekly'); } catch (e) {}
  }
  S.settings.reminders = on;
  persist();
}

function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist && !S.settings.persistAsked) {
    S.settings.persistAsked = true;
    navigator.storage.persist().catch(() => {});
    persist();
  }
}

/* ---------- Boot ---------- */
async function boot() {
  try { S = await kvGet('state'); } catch (e) { S = null; }
  if (!S) S = freshState();
  S = Object.assign(freshState(), S);
  S.settings = Object.assign(freshState().settings, S.settings);
  S.ui = Object.assign(freshState().ui, S.ui);
  invalidate();
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  LOCKED = !!S.settings.pinHash;
  window.addEventListener('hashchange', () => { try { sessionStorage.setItem('ql-nav', '1'); } catch (e) {} render(); });
  render();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    let had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (had) toast('Questline was updated. Reopen the app to use the new version.', 5000);
      had = true;
    });
  }
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstall = e;
  if (S && !LOCKED && (parseHash().parts[0] || '') === '') render();
});
window.addEventListener('appinstalled', () => { deferredInstall = null; toast('Questline installed'); });
async function promptInstall() {
  if (!deferredInstall) { toast('Use your browser menu → "Install app" / "Add to Home screen"'); return; }
  deferredInstall.prompt();
  await deferredInstall.userChoice.catch(() => {});
  deferredInstall = null;
  render();
}

boot();
