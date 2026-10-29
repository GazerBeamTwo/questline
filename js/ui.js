'use strict';
/* Shared UI helpers and components. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (self.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const ICONS = {
  skill: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  experience: '<circle cx="12" cy="12" r="9.5"/><path d="m15.8 8.2-2.1 5.5-5.5 2.1 2.1-5.5z"/>',
  knowledge: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  chev: '<path d="M9 18l6-6-6-6"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  camera: '<path d="M22 18.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5l2-3h5l2 3H20a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.8"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  share: '<path d="M4 12v8h16v-8M16 6l-4-4-4 4M12 2v13"/>',
  settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  history: '<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20v-.5a6 6 0 0 1 12 0v.5M16 4.5a3.5 3.5 0 0 1 0 7M22 20v-.5a6 6 0 0 0-4-5.6"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  install: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M12 7v7M9 11l3 3 3-3"/>'
};
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

/* Crest logo used in the header + icons. */
const LOGO = `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5 27 7v8.5c0 7-5 11.5-11 14-6-2.5-11-7-11-14V7z" fill="var(--accent)" opacity=".16"/><path d="M16 2.5 27 7v8.5c0 7-5 11.5-11 14-6-2.5-11-7-11-14V7z" fill="none" stroke="var(--accent)" stroke-width="1.6"/><circle cx="16" cy="10" r="2.2" fill="var(--accent)"/><circle cx="11" cy="19" r="2.2" fill="var(--accent)"/><circle cx="21" cy="19" r="2.2" fill="var(--accent)"/><path d="M16 12.2v2.8l-4.2 2.4M16 15l4.2 2.4" stroke="var(--accent)" stroke-width="1.4" fill="none"/></svg>`;

function moodFace(v, size = 22) {
  const curve = (v - 3) * 2;
  return `<svg class="mood-face m${v}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="8.6" cy="10" r="1.1" class="eye"/><circle cx="15.4" cy="10" r="1.1" class="eye"/><path d="M7.5 15.5 Q12 ${15.5 + curve} 16.5 15.5"/></svg>`;
}

/* Radar chart of the six stats. */
function radar(stats, { size = 280, labels = true, compare = null } = {}) {
  const n = STATS.length, cx = size / 2, cy = size / 2;
  const R = size / 2 - (labels ? 48 : 6);
  const top = Math.max(...STATS.map((s) => stats[s]), ...(compare ? STATS.map((s) => compare[s]) : [0]));
  const max = Math.max(10, Math.ceil(top / 5) * 5);
  const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const poly = (vals) => STATS.map((s, i) => pt(i, Math.max(R * 0.04, (R * vals[s]) / max)).map((v) => v.toFixed(1)).join(',')).join(' ');
  let g = '';
  for (let k = 1; k <= 4; k++) g += `<polygon class="r-ring" points="${STATS.map((_, i) => pt(i, (R * k) / 4).map((v) => v.toFixed(1)).join(',')).join(' ')}"/>`;
  STATS.forEach((_, i) => { const [x, y] = pt(i, R); g += `<line class="r-axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; });
  if (compare) g += `<polygon class="r-compare" points="${poly(compare)}"/>`;
  g += `<polygon class="r-data" points="${poly(stats)}"/>`;
  STATS.forEach((s, i) => { const [x, y] = pt(i, Math.max(R * 0.04, (R * stats[s]) / max)); g += `<circle class="r-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${labels ? 3.2 : 2}"/>`; });
  if (labels) STATS.forEach((s, i) => {
    const [x, y] = pt(i, R + 26);
    g += `<text class="r-label" x="${x.toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle">${s}</text><text class="r-val" x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" text-anchor="middle">${Math.round(stats[s])}</text>`;
  });
  return `<svg class="radar" viewBox="0 0 ${size} ${size}" role="img" aria-label="Stats: ${STATS.map((s) => s + ' ' + Math.round(stats[s])).join(', ')}">${g}</svg>`;
}

function orb(n, st, cls = '') {
  return `<span class="orb ty-${n.type} st-${st} ${cls}">${icon(st === 'locked' ? 'lock' : n.type)}</span>`;
}
function pips(level) {
  return `<span class="pips" aria-label="Level ${level} of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= level ? 'on' : ''}"></i>`).join('')}</span>`;
}

function photoImg(id, cls = '') {
  return `<img class="photo ${cls}" data-photo="${esc(id)}" alt="" loading="lazy">`;
}
function hydratePhotos(root = document) {
  $$('img[data-photo]', root).forEach(async (img) => {
    if (img.src) return;
    const url = await photoURL(img.dataset.photo);
    if (url) img.src = url; else img.classList.add('missing');
  });
}

/* Toast */
let _toastTimer;
function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* Bottom sheet modal. Returns { el, close }. */
function openSheet(html, { onClose } = {}) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${html}</div>`;
  requestAnimationFrame(() => root.classList.add('open'));
  const close = () => {
    root.classList.remove('open');
    setTimeout(() => { if (!root.classList.contains('open')) root.innerHTML = ''; }, 260);
    onClose && onClose();
  };
  $('.sheet-backdrop', root).addEventListener('click', close);
  $$('[data-close]', root).forEach((b) => b.addEventListener('click', close));
  return { el: $('.sheet', root), close };
}

function confirmDialog(message, { ok = 'Delete', danger = true } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const s = openSheet(`<p class="confirm-msg">${esc(message)}</p><div class="row-btns"><button class="btn ghost" data-close>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cf-ok">${esc(ok)}</button></div>`,
      { onClose: () => { if (!done) resolve(false); } });
    $('#cf-ok', s.el).addEventListener('click', () => { done = true; resolve(true); s.close(); });
  });
}

function promptDialog(title, value = '', { ok = 'Save', placeholder = '' } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const s = openSheet(`<h3 class="sheet-h">${esc(title)}</h3><form id="pd-form"><input class="input" id="pd-in" value="${esc(value)}" placeholder="${esc(placeholder)}" maxlength="60" required><div class="row-btns"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn primary">${esc(ok)}</button></div></form>`,
      { onClose: () => { if (!done) resolve(null); } });
    const inp = $('#pd-in', s.el);
    setTimeout(() => inp.focus(), 200);
    $('#pd-form', s.el).addEventListener('submit', (e) => { e.preventDefault(); done = true; resolve(inp.value.trim()); s.close(); });
  });
}

/* Unlock / level-up celebration sequence. items: [{kind:'unlock'|'level'|'char'|'title', node?, level?, title?}] */
function celebrate(items) {
  if (!items.length) return Promise.resolve();
  return new Promise((resolve) => {
    const root = $('#overlay-root');
    let i = 0;
    const next = () => {
      if (i >= items.length) {
        const c = $('.cel', root);
        if (c) { c.classList.add('out'); setTimeout(() => { root.innerHTML = ''; }, 280); } else root.innerHTML = '';
        resolve();
        return;
      }
      const it = items[i++];
      root.innerHTML = celebrationHTML(it);
      if (navigator.vibrate && !reducedMotion()) navigator.vibrate(it.kind === 'char' ? [30, 60, 30, 60, 60] : [25, 50, 40]);
      const el = $('.cel', root);
      let ready = false;
      setTimeout(() => { ready = true; }, 450);
      el.addEventListener('click', () => { if (ready) next(); });
    };
    next();
  });
}
function celebrationHTML(it) {
  const parts = Array.from({ length: 22 }, (_, k) => {
    const a = (360 / 22) * k + Math.random() * 10;
    const d = 110 + Math.random() * 90;
    return `<i style="--a:${a.toFixed(0)}deg;--d:${d.toFixed(0)}px;--s:${(0.6 + Math.random() * 0.8).toFixed(2)};--t:${(Math.random() * 0.25).toFixed(2)}s"></i>`;
  }).join('');
  let ty = 'char', glyph = '', kicker = '', title = '', sub = '';
  if (it.kind === 'char') {
    glyph = `<span class="cel-num">${it.level}</span>`;
    kicker = 'Level up!';
    title = `You reached Level ${it.level}`;
    sub = it.title ? `Title: ${esc(it.title)}` : 'Your character grows with every proof you write.';
  } else if (it.kind === 'title') {
    glyph = icon('sparkle');
    kicker = 'New title earned';
    title = esc(it.title);
    sub = `Your strongest stat is now ${esc(it.stat)}.`;
  } else {
    ty = it.node.type;
    glyph = icon(it.node.type);
    if (it.kind === 'unlock') {
      kicker = it.node.type === 'skill' ? 'Skill unlocked' : 'Unlocked!';
      title = esc(it.node.title);
      sub = it.node.type === 'skill' ? 'Level 1 of 5. Keep writing to level up.' : `${TYPES[it.node.type].label} · ${esc(it.node.category)}`;
    } else {
      kicker = 'Level up!';
      title = esc(it.node.title);
      sub = it.level >= 5 ? 'Level 5 of 5: Mastered.' : `Now Level ${it.level} of 5`;
    }
  }
  return `<div class="cel ty-${ty}" role="alertdialog" aria-label="${kicker}">
    <div class="cel-rays"></div>
    <div class="cel-center"><div class="cel-burst">${parts}</div><div class="cel-orb">${glyph}</div></div>
    <div class="cel-kicker">${kicker}</div>
    <div class="cel-title">${title}</div>
    <div class="cel-sub">${sub}</div>
    ${it.kind === 'level' || (it.kind === 'unlock' && it.node.type === 'skill') ? `<div class="cel-pips">${pips(it.level)}</div>` : ''}
    <div class="cel-tap">Tap to continue</div>
  </div>`;
}

function lightbox(photoId) {
  const root = $('#overlay-root');
  root.innerHTML = `<div class="lightbox">${photoImg(photoId)}<button class="icon-btn lb-close" aria-label="Close">${icon('x')}</button></div>`;
  hydratePhotos(root);
  $('.lightbox', root).addEventListener('click', () => { root.innerHTML = ''; });
}

function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function pickFile(accept) {
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept;
    inp.onchange = () => resolve(inp.files[0] || null);
    inp.click();
  });
}
