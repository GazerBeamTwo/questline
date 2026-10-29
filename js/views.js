'use strict';
/* Screens. Each returns an HTML string or { html, mount(root) }. */

function topbar(title, { back = false, fallback = '#/', right = '' } = {}) {
  return `<header class="topbar">${back ? `<button class="icon-btn" data-action="back" data-fallback="${fallback}" aria-label="Back">${icon('back')}</button>` : ''}<h1 class="tb-title">${title}</h1><div class="tb-right">${right}</div></header>`;
}

function nodeRow(n, sub) {
  const st = status(n);
  const i = getD().info.get(n.id);
  const s = sub ?? (n.type === 'skill' && i.level ? `Level ${i.level} of 5` : STATUS_LABEL[st]);
  return `<a class="nrow st-${st}" href="#/node/${n.id}">${orb(n, st, 'sm')}<span class="nrow-main"><span class="nrow-title">${esc(n.title)}</span><span class="nrow-sub">${esc(s)}${n.type === 'skill' && i.level ? ' ' + pips(i.level) : ''}</span></span>${icon('chev', 'chev')}</a>`;
}

function entryCard(e, { compact = false } = {}) {
  const nodes = (e.nodeIds || []).map(nodeById).filter(Boolean);
  const photos = e.photoIds || [];
  return `<a class="ecard" href="#/entry/${e.id}">
    <div class="ecard-head"><span class="ecard-date">${fmtDate(e.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>${e.mood ? moodFace(e.mood, 20) : ''}</div>
    ${!isOwn(e) ? `<div class="author">${icon('users')} ${esc(e.authorName || 'Friend')}</div>` : ''}
    ${e.text ? `<p class="ecard-text ${compact ? 'clamp2' : 'clamp4'}">${esc(e.text)}</p>` : ''}
    ${photos.length ? `<div class="ecard-photos">${photos.slice(0, 3).map((p) => photoImg(p)).join('')}${photos.length > 3 ? `<span class="more">+${photos.length - 3}</span>` : ''}</div>` : ''}
    ${nodes.length ? `<div class="chips">${nodes.map((n) => `<span class="chip ty-${n.type}">${icon(n.type)}${esc(n.title)}</span>`).join('')}</div>` : ''}
  </a>`;
}

function emptyState(title, body, cta = '') {
  return `<div class="empty">${LOGO}<h3>${title}</h3><p>${body}</p>${cta}</div>`;
}

/* ================= HOME ================= */
function nextUp(count = 3) {
  const d = getD();
  const dependents = (id) => S.nodes.filter((n) => (n.prereqs || []).includes(id)).length;
  const avail = S.nodes.filter((n) => status(n) === 'available')
    .sort((a, b) => dependents(b.id) - dependents(a.id) || (a.createdAt || 0) - (b.createdAt || 0));
  const skills = S.nodes.filter((n) => n.type === 'skill' && status(n) === 'unlocked')
    .sort((a, b) => (d.info.get(a.id).nextAt - d.info.get(a.id).count) - (d.info.get(b.id).nextAt - d.info.get(b.id).count));
  const out = [];
  // Mix: mostly new things to unlock, plus a skill in progress if there is one.
  if (skills.length) out.push(skills[0]);
  for (const n of avail) { if (out.length >= count) break; out.push(n); }
  for (const n of skills.slice(1)) { if (out.length >= count) break; out.push(n); }
  return out.slice(0, count);
}

function onThisDay() {
  const today = todayISO();
  const md = today.slice(5);
  const y = today.slice(0, 4);
  const own = S.entries.filter(isOwn);
  let hits = own.filter((e) => e.date.slice(5) === md && e.date.slice(0, 4) < y);
  if (hits.length) return { label: 'On this day', entries: hits.sort(sortEntriesAsc) };
  hits = own.filter((e) => e.date.slice(8) === today.slice(8) && e.date < today.slice(0, 8) + '00');
  if (hits.length) {
    const e = hits.sort(sortEntriesAsc).pop();
    const months = (Number(y) - Number(e.date.slice(0, 4))) * 12 + (Number(today.slice(5, 7)) - Number(e.date.slice(5, 7)));
    return { label: months === 1 ? 'One month ago today' : `${months} months ago today`, entries: [e] };
  }
  return null;
}

function vHome() {
  const d = getD();
  const t = titleFor(d.stats);
  const lv = d.level;
  const into = d.total - lv.cur, need = lv.next - lv.cur;
  const next = nextUp(3);
  const seen = new Set();
  const recent = [...d.events].sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : b.ts - a.ts || b.level - a.level)).filter((ev) => !seen.has(ev.nodeId) && seen.add(ev.nodeId)).slice(0, 4);
  const otd = onThisDay();
  const lastOwn = S.entries.filter(isOwn).reduce((m, e) => Math.max(m, e.createdAt || 0), 0);
  const showReflect = S.settings.reminders && S.entries.length && Date.now() - lastOwn > 7 * 864e5;
  const showInstall = deferredInstall && !S.ui.installDismissed;

  const html = `
  <header class="topbar home-top"><div class="brand">${LOGO}<span>Questline</span></div><div class="tb-right"><a class="icon-btn" href="#/recap" aria-label="Character recap">${icon('history')}</a><a class="icon-btn" href="#/settings" aria-label="Settings">${icon('settings')}</a></div></header>
  <div class="page">
    <a class="char-card" href="#/sheet">
      <div class="cc-main">
        <div class="crest"><span>${lv.level}</span></div>
        <div class="cc-text">
          <div class="cc-name serif">${esc(S.profile.name || 'Adventurer')}</div>
          <div class="cc-title">Level ${lv.level} · ${esc(t.title)}</div>
          <div class="xp"><div class="xp-bar"><i style="width:${Math.round((into / need) * 100)}%"></i></div><div class="xp-txt">${into} / ${need} unlocks to Level ${lv.level + 1}</div></div>
        </div>
      </div>
      <div class="cc-radar">${radar(d.stats, { size: 120, labels: false })}</div>
    </a>

    <a class="big-new" href="#/entry/new">${icon('plus')}<span>New Entry</span></a>

    ${showInstall ? `<div class="card banner"><div>${icon('install')}</div><div class="banner-text"><b>Install Questline</b><span>Add it to your home screen. It works offline.</span></div><button class="btn primary small" id="do-install">Install</button><button class="icon-btn" id="dismiss-install" aria-label="Dismiss">${icon('x')}</button></div>` : ''}

    ${showReflect ? `<a class="card reflect" href="#/entry/new"><span class="kicker">Weekly reflection</span><b class="serif">What did you do this week?</b><span class="muted">Anything counts: a small step, a thing you noticed, a good day.</span></a>` : ''}

    ${otd ? `<section><h2 class="sec-h">${icon('history')} ${otd.label}</h2>${otd.entries.slice(0, 2).map((e) => entryCard(e, { compact: true })).join('')}</section>` : ''}

    <section><h2 class="sec-h">${icon('sparkle')} Next up</h2>
      ${next.length ? `<div class="list">${next.map((n) => nodeRow(n, n.type === 'skill' && status(n) === 'unlocked' ? `${getD().info.get(n.id).nextAt - getD().info.get(n.id).count} more entr${getD().info.get(n.id).nextAt - getD().info.get(n.id).count === 1 ? 'y' : 'ies'} to Level ${getD().info.get(n.id).level + 1}` : `Ready to unlock · ${n.category}`)).join('')}</div>`
        : `<div class="card muted-card">Nothing available right now. <a href="#/tree">Add a node to your tree</a>.</div>`}
    </section>

    <section><h2 class="sec-h">${icon('check')} Recent unlocks</h2>
      ${recent.length ? `<div class="list">${recent.map((ev) => { const n = nodeById(ev.nodeId); return nodeRow(n, `${ev.kind === 'level' ? `Reached Level ${ev.level}` : 'Unlocked'} · ${fmtDate(ev.date, { day: 'numeric', month: 'short' })}`); }).join('')}</div>`
        : `<div class="card muted-card">Your first unlock is one journal entry away. Pick something from <b>Next up</b> and write about it.</div>`}
    </section>
  </div>`;
  return {
    html,
    mount(root) {
      const i = $('#do-install', root); if (i) i.addEventListener('click', promptInstall);
      const x = $('#dismiss-install', root); if (x) x.addEventListener('click', () => { S.ui.installDismissed = true; persist(); render(); });
    }
  };
}

/* ================= SKILL TREE ================= */
function vTree(q) {
  if (!S.trees.length) {
    return { html: `${topbar('Skill Tree')}<div class="page">${emptyState('No trees yet', 'Create a tree for an area of your life, or start from a template.', `<div class="row-btns center"><button class="btn primary" id="new-tree">${icon('plus')} New tree</button><a class="btn ghost" href="#/settings?s=packs">Templates</a></div>`)}</div>`, mount: (r) => $('#new-tree', r).addEventListener('click', newTree) };
  }
  let tid = q.get('t') || S.ui.lastTree;
  if (!treeById(tid)) tid = S.trees[0].id;
  if (S.ui.lastTree !== tid) { S.ui.lastTree = tid; kvSet('state', S).catch(() => {}); }
  const tree = treeById(tid);
  const nodes = S.nodes.filter((n) => n.treeId === tid);
  const L = layoutTree(nodes);
  const unlockedCount = nodes.filter((n) => getD().info.get(n.id).unlocked).length;

  let lines = '';
  for (const n of nodes) for (const p of n.prereqs || []) {
    const a = L.pos.get(p), b = L.pos.get(n.id);
    if (!a || !b) continue;
    const done = getD().info.get(p).unlocked;
    const live = done && status(n) !== 'locked';
    const my = (a.y + b.y) / 2;
    lines += `<path class="edge ${done ? 'done' : ''} ${getD().info.get(n.id).unlocked ? 'full' : live ? 'live' : ''}" d="M${a.x},${a.y + 30} C${a.x},${my} ${b.x},${my} ${b.x},${b.y - 30}"/>`;
  }
  const nodeEls = nodes.map((n) => {
    const p = L.pos.get(n.id), st = status(n), i = getD().info.get(n.id);
    return `<a class="tnode st-${st} ty-${n.type}" href="#/node/${n.id}" style="left:${p.x}px;top:${p.y}px" aria-label="${esc(n.title)}, ${TYPES[n.type].label}, ${STATUS_LABEL[st]}">
      <span class="tn-orb">${icon(st === 'locked' ? 'lock' : n.type)}</span>
      ${n.type === 'skill' && i.level ? `<span class="tn-lvl">${i.level}</span>` : ''}
      <span class="tn-label">${esc(n.title)}</span></a>`;
  }).join('');

  const html = `${topbar('Skill Tree', { right: `<a class="icon-btn" href="#/node/new?tree=${tid}" aria-label="Add node">${icon('plus')}</a>` })}
  <div class="tree-tabs" role="tablist">${S.trees.map((t) => `<a role="tab" class="ttab ${t.id === tid ? 'on' : ''}" href="#/tree?t=${t.id}">${t.shared ? icon('users') : ''}${esc(t.name)}</a>`).join('')}<button class="ttab add" id="new-tree" aria-label="New tree">${icon('plus')}</button></div>
  <div class="tree-head">
    <div><div class="serif tree-name">${esc(tree.name)}</div><div class="muted small">${unlockedCount} of ${nodes.length} unlocked${tree.shared ? ` · Shared${tree.members.length ? ' with ' + esc(tree.members.join(', ')) : ''}` : ''}</div></div>
    <button class="btn ghost small" id="tree-menu">Manage</button>
  </div>
  ${nodes.length ? `<div class="tree-scroll" id="tree-scroll"><div class="tree-canvas" style="width:${L.width}px;height:${L.height}px"><svg class="edges" width="${L.width}" height="${L.height}">${lines}</svg>${nodeEls}</div></div>
  <div class="legend"><span><i class="lg st-locked"></i>Locked</span><span><i class="lg st-available"></i>Available</span><span><i class="lg st-unlocked"></i>Unlocked</span><span class="lg-types"><b class="ty-skill">${icon('skill')}</b>Skill <b class="ty-experience">${icon('experience')}</b>Experience <b class="ty-knowledge">${icon('knowledge')}</b>Knowledge</span></div>`
    : `<div class="page">${emptyState('An empty tree', 'Add your first node: a skill, an experience or something to learn.', `<a class="btn primary" href="#/node/new?tree=${tid}">${icon('plus')} Add node</a>`)}</div>`}`;

  return {
    html,
    mount(root) {
      const sc = $('#tree-scroll', root);
      if (sc) sc.scrollLeft = 0;
      $('#new-tree', root).addEventListener('click', newTree);
      $('#tree-menu', root).addEventListener('click', () => treeMenu(tree));
    }
  };
}
async function newTree() {
  const name = await promptDialog('New tree', '', { ok: 'Create', placeholder: 'e.g. Fitness, Travel, Music' });
  if (!name) return;
  const t = { id: uid(), name, createdAt: Date.now(), shared: false, members: [] };
  S.trees.push(t);
  persist();
  go('#/tree?t=' + t.id);
}
function treeMenu(tree) {
  const s = openSheet(`<h3 class="sheet-h">${esc(tree.name)}</h3>
    <div class="menu">
      <a class="mitem" href="#/node/new?tree=${tree.id}" data-close>${icon('plus')} Add a node</a>
      <button class="mitem" id="tm-rename">${icon('edit')} Rename tree</button>
      ${S.settings.social ? `<button class="mitem" id="tm-share">${icon('users')} ${tree.shared ? 'Shared tree settings' : 'Make this a shared tree'}</button>` : ''}
      <button class="mitem danger" id="tm-del">${icon('trash')} Delete tree</button>
    </div>`);
  $('#tm-rename', s.el).addEventListener('click', async () => {
    s.close();
    const name = await promptDialog('Rename tree', tree.name);
    if (name) { tree.name = name; persist(); render(); }
  });
  const sh = $('#tm-share', s.el);
  if (sh) sh.addEventListener('click', () => { s.close(); setTimeout(() => shareSheet(tree), 280); });
  $('#tm-del', s.el).addEventListener('click', async () => {
    s.close();
    const count = S.nodes.filter((n) => n.treeId === tree.id).length;
    if (await confirmDialog(`Delete "${tree.name}" and its ${count} node${count === 1 ? '' : 's'}? Your journal entries are kept.`)) { deleteTree(tree.id); go('#/tree', true); render(); }
  });
}
function shareSheet(tree) {
  const s = openSheet(`<h3 class="sheet-h">${icon('users')} Shared tree</h3>
    <p class="muted small">Shared trees unlock together: when anyone writes proof against a node, it unlocks for everyone. Your stats still only grow from your own entries.</p>
    <label class="field"><span>Who's in it? (names, comma-separated)</span><input class="input" id="sh-members" value="${esc((tree.members || []).join(', '))}" placeholder="e.g. Sam, Alex"></label>
    <label class="check"><input type="checkbox" id="sh-photos"> Include photos in the file</label>
    <p class="muted small">Sending the file shares this tree's nodes and any of your entries linked to them (only the links to this tree; your other nodes stay private). Your friends import it in Settings, then send theirs back.</p>
    <div class="row-btns"><button class="btn ghost" id="sh-off">${tree.shared ? 'Stop sharing' : 'Cancel'}</button><button class="btn primary" id="sh-send">${icon('share')} Send tree file</button></div>`);
  const saveMembers = () => {
    tree.members = $('#sh-members', s.el).value.split(',').map((x) => x.trim()).filter(Boolean);
    tree.shared = true;
    persist();
  };
  $('#sh-send', s.el).addEventListener('click', async () => { saveMembers(); const inc = $('#sh-photos', s.el).checked; s.close(); render(); await exportSharedTree(tree.id, inc); });
  $('#sh-off', s.el).addEventListener('click', () => { if (tree.shared) { tree.shared = false; persist(); render(); } s.close(); });
}

/* ================= NODE DETAIL ================= */
function vNode(id) {
  const n = nodeById(id);
  if (!n) return vNotFound();
  const st = status(n), i = getD().info.get(n.id), tree = treeById(n.treeId);
  const prereqs = (n.prereqs || []).map(nodeById).filter(Boolean);
  const leadsTo = S.nodes.filter((x) => (x.prereqs || []).includes(n.id));
  const entries = [...i.entries].sort(sortEntriesAsc).reverse();
  let progress = '';
  if (n.type === 'skill') {
    const span = i.nextAt ? i.nextAt - i.prevAt : 1;
    const into = i.nextAt ? i.count - i.prevAt : 1;
    progress = `<div class="card skill-prog"><div class="sp-top"><b>${i.level ? `Level ${i.level}` : 'Not started'}</b>${pips(i.level)}</div>
      <div class="xp-bar"><i style="width:${Math.round((into / span) * 100)}%"></i></div>
      <div class="muted small">${i.level >= 5 ? `Mastered · ${i.count} entries of proof` : `${i.nextAt - i.count} more entr${i.nextAt - i.count === 1 ? 'y' : 'ies'} to Level ${i.level + 1}`}</div></div>`;
  }
  const cta = st === 'locked'
    ? `<div class="card locked-note">${icon('lock')}<span>Unlock the prerequisites first, then write about this to unlock it.</span></div>`
    : `<a class="btn primary block" href="#/entry/new?node=${n.id}">${icon('edit')} ${i.unlocked ? (n.type === 'skill' && i.level < 5 ? 'Write proof to level up' : 'Add another entry') : 'Write proof to unlock'}</a>`;

  const html = `${topbar('', { back: true, fallback: '#/tree?t=' + n.treeId, right: `<a class="icon-btn" href="#/node/${n.id}/edit" aria-label="Edit">${icon('edit')}</a>` })}
  <div class="page">
    <div class="node-hero ty-${n.type} st-${st}">
      <div class="nh-orb">${icon(st === 'locked' ? 'lock' : n.type)}</div>
      <h1 class="serif">${esc(n.title)}</h1>
      <div class="chips center"><span class="chip ty-${n.type}">${icon(n.type)}${TYPES[n.type].label}</span><span class="chip">${esc(n.category)}</span>${tree ? `<a class="chip" href="#/tree?t=${tree.id}">${esc(tree.name)}</a>` : ''}<span class="chip status st-${st}">${STATUS_LABEL[st]}</span></div>
      ${i.unlockedAt ? `<div class="muted small">Unlocked ${fmtDate(i.unlockedAt)}</div>` : ''}
    </div>
    ${n.description ? `<p class="desc">${esc(n.description)}</p>` : ''}
    ${progress}
    ${cta}
    ${prereqs.length ? `<section><h2 class="sec-h">Requires</h2><div class="list">${prereqs.map((p) => nodeRow(p)).join('')}</div></section>` : ''}
    ${leadsTo.length ? `<section><h2 class="sec-h">Leads to</h2><div class="list">${leadsTo.map((p) => nodeRow(p)).join('')}</div></section>` : ''}
    <section><h2 class="sec-h">Proof <span class="count">${entries.length}</span></h2>
      ${entries.length ? entries.map((e) => entryCard(e, { compact: true })).join('') : `<div class="card muted-card">No entries yet. Journal entries linked to this node show up here.</div>`}
    </section>
  </div>`;
  return html;
}

/* ================= NODE EDIT ================= */
function vNodeEdit(id, q) {
  const existing = id ? nodeById(id) : null;
  if (id && !existing) return vNotFound();
  const n = existing ? { ...existing, prereqs: [...(existing.prereqs || [])] }
    : { id: null, title: '', type: 'experience', category: 'Adventure', description: '', treeId: q.get('tree') || S.ui.lastTree || (S.trees[0] && S.trees[0].id), prereqs: [] };
  if (!S.trees.length) return { html: `${topbar('New node', { back: true })}<div class="page">${emptyState('Create a tree first', 'Nodes live inside trees.', `<a class="btn primary" href="#/tree">Go to Skill Tree</a>`)}</div>` };

  const prereqOptions = (treeId) => {
    const blocked = n.id ? descendantsOf(n.id, S.nodes) : new Set();
    return S.nodes.filter((x) => x.treeId === treeId && x.id !== n.id && !blocked.has(x.id));
  };
  const prereqHTML = (treeId) => {
    const opts = prereqOptions(treeId);
    if (!opts.length) return `<p class="muted small">No other nodes in this tree yet.</p>`;
    return opts.map((x) => `<label class="pick"><input type="checkbox" name="prereq" value="${x.id}" ${n.prereqs.includes(x.id) ? 'checked' : ''}>${orb(x, status(x), 'xs')}<span>${esc(x.title)}</span></label>`).join('');
  };

  const html = `${topbar(existing ? 'Edit node' : 'New node', { back: true, fallback: '#/tree' })}
  <form class="page form" id="node-form">
    <label class="field"><span>Title</span><input class="input" name="title" required maxlength="80" value="${esc(n.title)}" placeholder="e.g. Run 10k, Guitar, Learn how taxes work"></label>
    <div class="field"><span>Type</span><div class="seg types">${Object.entries(TYPES).map(([k, t]) => `<label class="seg-opt ty-${k}"><input type="radio" name="type" value="${k}" ${n.type === k ? 'checked' : ''}><span>${icon(k)}<b>${t.label}</b><small>${t.hint}</small></span></label>`).join('')}</div></div>
    <div class="two">
      <label class="field"><span>Category</span><select class="input" name="category">${CATEGORIES.map((c) => `<option ${c === n.category ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="field"><span>Tree</span><select class="input" name="treeId" id="tree-sel">${S.trees.map((t) => `<option value="${t.id}" ${t.id === n.treeId ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Description</span><textarea class="input" name="description" rows="3" maxlength="500" placeholder="What does unlocking this look like?">${esc(n.description)}</textarea></label>
    <div class="field"><span>Prerequisites <small class="muted">(must be unlocked first)</small></span><div class="picklist" id="prereqs">${prereqHTML(n.treeId)}</div></div>
    <div class="form-actions">${existing ? `<button type="button" class="btn danger ghost" id="del-node">${icon('trash')} Delete</button>` : ''}<button class="btn primary">${existing ? 'Save' : 'Add node'}</button></div>
  </form>`;

  return {
    html,
    mount(root) {
      const form = $('#node-form', root);
      $('#tree-sel', root).addEventListener('change', (e) => { n.prereqs = []; $('#prereqs', root).innerHTML = prereqHTML(e.target.value); });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = {
          title: fd.get('title').trim(), type: fd.get('type'), category: fd.get('category'), treeId: fd.get('treeId'),
          description: fd.get('description').trim(), prereqs: fd.getAll('prereq'), updatedAt: Date.now()
        };
        if (!data.title) return;
        let target;
        if (existing) { Object.assign(existing, data); target = existing; }
        else { target = { id: uid(), createdAt: Date.now(), ...data }; S.nodes.push(target); }
        persist();
        toast(existing ? 'Node saved' : 'Node added');
        go('#/node/' + target.id, true);
      });
      const del = $('#del-node', root);
      if (del) del.addEventListener('click', async () => {
        const c = getD().info.get(existing.id).count;
        if (await confirmDialog(`Delete "${existing.title}"?${c ? ` Its ${c} linked entr${c === 1 ? 'y stays' : 'ies stay'} in your journal.` : ''}`)) {
          const t = existing.treeId; deleteNode(existing.id); go('#/tree?t=' + t, true);
        }
      });
    }
  };
}

/* ================= ENTRY EDIT ================= */
function vEntryEdit(id, q) {
  const existing = id ? S.entries.find((e) => e.id === id) : null;
  if (id && (!existing || !isOwn(existing))) return vNotFound();
  const draft = {
    id: existing ? existing.id : null,
    date: existing ? existing.date : todayISO(),
    mood: existing ? existing.mood || 0 : 0,
    text: existing ? existing.text : '',
    nodeIds: new Set(existing ? existing.nodeIds || [] : (q.get('node') ? [q.get('node')] : [])),
    keepPhotoIds: existing ? [...(existing.photoIds || [])] : [],
    newPhotos: [], removedPhotoIds: []
  };
  let search = '';

  const photosHTML = () => `${draft.keepPhotoIds.map((p) => `<div class="pthumb">${photoImg(p)}<button type="button" class="pdel" data-keep="${p}" aria-label="Remove photo">${icon('x')}</button></div>`).join('')}
    ${draft.newPhotos.map((p, i) => `<div class="pthumb"><img class="photo" src="${p.url}" alt=""><button type="button" class="pdel" data-new="${i}" aria-label="Remove photo">${icon('x')}</button></div>`).join('')}
    <label class="padd">${icon('camera')}<span>Add</span><input type="file" accept="image/*" multiple id="photo-in" hidden></label>`;

  const selectedHTML = () => {
    const sel = [...draft.nodeIds].map(nodeById).filter(Boolean);
    return sel.length ? sel.map((n) => `<button type="button" class="chip ty-${n.type} removable" data-unlink="${n.id}">${icon(n.type)}${esc(n.title)}${icon('x', 'cx')}</button>`).join('')
      : `<span class="muted small">Not linked to anything: a free entry. Link a node to unlock it or level it up.</span>`;
  };
  const pickerHTML = () => {
    const s = search.toLowerCase();
    return S.trees.map((t) => {
      const ns = S.nodes.filter((n) => n.treeId === t.id && (!s || n.title.toLowerCase().includes(s)));
      if (!ns.length) return '';
      const order = { available: 0, unlocked: 1, mastered: 2, locked: 3 };
      ns.sort((a, b) => order[status(a)] - order[status(b)]);
      return `<div class="pk-group"><div class="pk-tree">${esc(t.name)}</div>${ns.map((n) => {
        const st = status(n), lockd = st === 'locked';
        const i = getD().info.get(n.id);
        const hint = lockd ? 'Locked' : st === 'available' ? 'Will unlock' : n.type === 'skill' && st === 'unlocked' ? `Lv ${i.level} → progress` : 'Already unlocked';
        return `<label class="pick ${lockd ? 'disabled' : ''}"><input type="checkbox" data-link="${n.id}" ${draft.nodeIds.has(n.id) ? 'checked' : ''} ${lockd && !draft.nodeIds.has(n.id) ? 'disabled' : ''}>${orb(n, st, 'xs')}<span>${esc(n.title)}</span><small class="pk-hint st-${st}">${hint}</small></label>`;
      }).join('')}</div>`;
    }).join('') || `<p class="muted small">No matching nodes.</p>`;
  };

  const html = `${topbar(existing ? 'Edit entry' : 'New entry', { back: true, fallback: '#/journal' })}
  <form class="page form entry-form" id="entry-form">
    <div class="two">
      <label class="field"><span>Date</span><input class="input" type="date" name="date" value="${draft.date}" max="${todayISO()}" required></label>
      <div class="field"><span>Mood</span><div class="moods">${[1, 2, 3, 4, 5].map((v) => `<label class="mood" title="${MOODS[v - 1]}"><input type="radio" name="mood" value="${v}" ${draft.mood === v ? 'checked' : ''}>${moodFace(v, 30)}</label>`).join('')}</div></div>
    </div>
    <label class="field"><span>What happened?</span><textarea class="input journal-text" name="text" rows="7" placeholder="What did you do, notice or learn? How did it feel?">${esc(draft.text)}</textarea></label>
    <div class="field"><span>Photos</span><div class="photos-edit" id="photos">${photosHTML()}</div></div>
    <div class="field"><span>Proof for…</span><div class="chips" id="selected">${selectedHTML()}</div>
      <details class="picker" ${!existing && !q.get('node') ? 'open' : ''}><summary>${icon('link')} Link to nodes</summary>
        <input class="input" type="search" id="pk-search" placeholder="Search nodes">
        <div id="picker">${pickerHTML()}</div>
      </details>
    </div>
    <div class="form-actions sticky">${existing ? `<button type="button" class="btn danger ghost" id="del-entry">${icon('trash')}</button>` : ''}<button class="btn primary grow" id="save-entry">${existing ? 'Save entry' : 'Save entry'}</button></div>
  </form>`;

  return {
    html,
    noTabs: true,
    mount(root) {
      const form = $('#entry-form', root);
      const refreshPhotos = () => { $('#photos', root).innerHTML = photosHTML(); hydratePhotos($('#photos', root)); bindPhotoInput(); };
      const refreshLinks = () => { $('#selected', root).innerHTML = selectedHTML(); $('#picker', root).innerHTML = pickerHTML(); };
      const bindPhotoInput = () => {
        $('#photo-in', root).addEventListener('change', async (e) => {
          const files = [...e.target.files];
          for (const f of files) {
            try { const blob = await resizeImage(f); draft.newPhotos.push({ blob, url: URL.createObjectURL(blob) }); }
            catch (err) { toast('Could not read that image'); }
          }
          refreshPhotos();
        });
      };
      bindPhotoInput();
      $('#photos', root).addEventListener('click', (e) => {
        const k = e.target.closest('[data-keep]'), nw = e.target.closest('[data-new]');
        if (k) { draft.keepPhotoIds = draft.keepPhotoIds.filter((x) => x !== k.dataset.keep); draft.removedPhotoIds.push(k.dataset.keep); refreshPhotos(); }
        if (nw) { draft.newPhotos.splice(Number(nw.dataset.new), 1); refreshPhotos(); }
      });
      $('#selected', root).addEventListener('click', (e) => { const b = e.target.closest('[data-unlink]'); if (b) { draft.nodeIds.delete(b.dataset.unlink); refreshLinks(); } });
      $('#picker', root).addEventListener('change', (e) => {
        const id = e.target.dataset.link; if (!id) return;
        if (e.target.checked) draft.nodeIds.add(id); else draft.nodeIds.delete(id);
        $('#selected', root).innerHTML = selectedHTML();
      });
      $('#pk-search', root).addEventListener('input', (e) => { search = e.target.value; $('#picker', root).innerHTML = pickerHTML(); });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        draft.text = fd.get('text').trim();
        draft.date = fd.get('date') || todayISO();
        draft.mood = Number(fd.get('mood')) || 0;
        if (!draft.text && !draft.keepPhotoIds.length && !draft.newPhotos.length) { toast('Write a few words (or add a photo) first'); return; }
        $('#save-entry', root).disabled = true;
        await saveEntry({ ...draft, nodeIds: [...draft.nodeIds] });
      });
      const del = $('#del-entry', root);
      if (del) del.addEventListener('click', async () => {
        if (await confirmDialog('Delete this entry? Anything it unlocked will lock again.')) { await deleteEntry(existing.id); go('#/journal', true); }
      });
    }
  };
}

/* ================= ENTRY VIEW ================= */
function vEntry(id) {
  const e = S.entries.find((x) => x.id === id);
  if (!e) return vNotFound();
  const nodes = (e.nodeIds || []).map(nodeById).filter(Boolean);
  return `${topbar('', { back: true, fallback: '#/journal', right: isOwn(e) ? `<a class="icon-btn" href="#/entry/${e.id}/edit" aria-label="Edit">${icon('edit')}</a>` : '' })}
  <article class="page entry-view">
    <div class="ev-head"><div><div class="ev-date serif">${fmtDate(e.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      ${!isOwn(e) ? `<div class="author">${icon('users')} ${esc(e.authorName || 'Friend')}</div>` : ''}</div>
      ${e.mood ? `<div class="ev-mood">${moodFace(e.mood, 30)}<span>${MOODS[e.mood - 1]}</span></div>` : ''}</div>
    ${e.text ? `<div class="ev-text">${esc(e.text)}</div>` : ''}
    ${(e.photoIds || []).length ? `<div class="gallery">${e.photoIds.map((p) => `<button class="gimg" data-action="photo" data-id="${p}">${photoImg(p)}</button>`).join('')}</div>` : ''}
    ${nodes.length ? `<section><h2 class="sec-h">Proof for</h2><div class="list">${nodes.map((n) => nodeRow(n)).join('')}</div></section>` : `<p class="muted small">A free entry, not linked to any node.</p>`}
  </article>`;
}

/* ================= JOURNAL FEED ================= */
const JF = { cat: '', node: '', from: '', to: '', open: false };
function vJournal() {
  let list = [...S.entries].sort(sortEntriesAsc).reverse();
  if (JF.node) list = list.filter((e) => (e.nodeIds || []).includes(JF.node));
  if (JF.cat) list = list.filter((e) => (e.nodeIds || []).some((id) => { const n = nodeById(id); return n && n.category === JF.cat; }));
  if (JF.from) list = list.filter((e) => e.date >= JF.from);
  if (JF.to) list = list.filter((e) => e.date <= JF.to);
  const active = JF.cat || JF.node || JF.from || JF.to;

  let groups = '', cur = '';
  for (const e of list) {
    const m = e.date.slice(0, 7);
    if (m !== cur) { if (cur) groups += '</div>'; groups += `<h2 class="month-h serif">${fmtMonth(m)}</h2><div class="feed">`; cur = m; }
    groups += entryCard(e);
  }
  if (cur) groups += '</div>';

  const html = `${topbar('Journal', { right: `<button class="icon-btn ${active ? 'on' : ''}" id="f-toggle" aria-label="Filters">${icon('filter')}</button>` })}
  <div class="page">
    <div class="filters ${JF.open || active ? 'open' : ''}" id="filters">
      <div class="two">
        <label class="field"><span>Category</span><select class="input" id="f-cat"><option value="">All</option>${CATEGORIES.map((c) => `<option ${JF.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="field"><span>Node</span><select class="input" id="f-node"><option value="">All</option>${S.trees.map((t) => `<optgroup label="${esc(t.name)}">${S.nodes.filter((n) => n.treeId === t.id).map((n) => `<option value="${n.id}" ${JF.node === n.id ? 'selected' : ''}>${esc(n.title)}</option>`).join('')}</optgroup>`).join('')}</select></label>
      </div>
      <div class="two">
        <label class="field"><span>From</span><input class="input" type="date" id="f-from" value="${JF.from}"></label>
        <label class="field"><span>To</span><input class="input" type="date" id="f-to" value="${JF.to}"></label>
      </div>
      ${active ? `<button class="btn ghost small" id="f-clear">Clear filters</button>` : ''}
    </div>
    ${list.length ? `<p class="muted small">${list.length} entr${list.length === 1 ? 'y' : 'ies'}</p>${groups}`
      : active ? emptyState('No matching entries', 'Try widening your filters.') : emptyState('Your journal is empty', 'Every entry is proof of who you are becoming. Start with something small.', `<a class="btn primary" href="#/entry/new">${icon('plus')} New entry</a>`)}
  </div>`;
  return {
    html,
    mount(root) {
      $('#f-toggle', root).addEventListener('click', () => { JF.open = !JF.open; $('#filters', root).classList.toggle('open', JF.open); });
      const upd = () => { JF.cat = $('#f-cat', root).value; JF.node = $('#f-node', root).value; JF.from = $('#f-from', root).value; JF.to = $('#f-to', root).value; JF.open = true; render(); };
      ['#f-cat', '#f-node', '#f-from', '#f-to'].forEach((s) => $(s, root).addEventListener('change', upd));
      const c = $('#f-clear', root); if (c) c.addEventListener('click', () => { Object.assign(JF, { cat: '', node: '', from: '', to: '' }); render(); });
    }
  };
}

/* ================= CHARACTER SHEET ================= */
function vSheet() {
  const d = getD();
  const t = titleFor(d.stats);
  const lv = d.level;
  const maxStat = Math.max(10, ...STATS.map((s) => d.stats[s]));
  const own = d.ownEvents;
  const count = (fn) => own.filter(fn).length;
  const unlockedSkills = S.nodes.filter((n) => n.type === 'skill' && d.info.get(n.id).unlocked).length;
  const titles = earnedTitles(d.stats);
  return `${topbar('Character', { right: `<a class="icon-btn" href="#/recap" aria-label="Recap">${icon('history')}</a>` })}
  <div class="page">
    <div class="sheet-hero">
      <div class="crest big"><span>${lv.level}</span></div>
      <div class="serif sh-name">${esc(S.profile.name || 'Adventurer')}</div>
      <div class="sh-title">${esc(t.title)}</div>
      <div class="xp wide"><div class="xp-bar"><i style="width:${Math.round(((d.total - lv.cur) / (lv.next - lv.cur)) * 100)}%"></i></div><div class="xp-txt">${d.total} total unlocks · ${lv.next - d.total} to Level ${lv.level + 1}</div></div>
    </div>
    <div class="card radar-card">${radar(d.stats, { size: 300 })}</div>
    <div class="card stat-list">${STATS.map((s) => `<div class="stat-row"><span class="sr-name">${s}</span><span class="sr-bar"><i style="width:${(d.stats[s] / maxStat) * 100}%"></i></span><span class="sr-val">${Math.round(d.stats[s])}</span></div>`).join('')}
      <details class="how"><summary>How stats are calculated</summary>
        <p>Stats can't be edited. They're worked out from what you've unlocked:</p>
        <ul><li>Unlocking an Experience or Knowledge node: <b>+${POINTS.unlock}</b> to its category's stat</li>
        <li>Each Skill level (1–5): <b>+${POINTS.skillLevel}</b></li>
        <li>Life Admin nodes split their points between Mind and Career</li>
        <li>Character level comes from total unlocks (each skill level counts as one)</li>
        <li>Skill levels need 1, 3, 6, 10 and 15 linked entries</li></ul>
      </details>
    </div>
    <div class="totals">
      <div class="tot"><b>${count((e) => nodeById(e.nodeId).type === 'experience')}</b><span>Experiences</span></div>
      <div class="tot"><b>${count((e) => nodeById(e.nodeId).type === 'knowledge')}</b><span>Knowledge</span></div>
      <div class="tot"><b>${unlockedSkills}</b><span>Skills</span></div>
      <div class="tot"><b>${S.entries.filter(isOwn).length}</b><span>Entries</span></div>
    </div>
    <section><h2 class="sec-h">${icon('sparkle')} Titles</h2>
      <div class="titles">${titles.map((x) => `<div class="ttl ${x.earned ? 'earned' : ''} ${x.title === t.title ? 'current' : ''}"><b>${esc(x.title)}</b><span>${x.stat} ${x.need}+</span></div>`).join('')}</div>
    </section>
    <a class="btn ghost block" href="#/recap">${icon('history')} Character Recap</a>
  </div>`;
}

/* ================= RECAP ================= */
function vRecap(q) {
  const mode = q.get('p') === 'year' ? 'year' : 'month';
  const today = todayISO();
  let key = q.get('d') || (mode === 'year' ? today.slice(0, 4) : today.slice(0, 7));
  const start = mode === 'year' ? key + '-01-01' : key + '-01';
  const end = mode === 'year' ? key + '-12-31' : lastDayOfMonth(key);
  const label = mode === 'year' ? key : fmtMonth(key);
  const shift = (dir) => {
    if (mode === 'year') return String(Number(key) + dir);
    const [y, m] = key.split('-').map(Number);
    const dt = new Date(y, m - 1 + dir, 1);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  };
  const prevK = shift(-1), nextK = shift(1);
  const canNext = (mode === 'year' ? nextK : nextK + '-01') <= (mode === 'year' ? today.slice(0, 4) : today);

  const own = S.entries.filter(isOwn);
  const before = derive(own.filter((e) => e.date < start), S.nodes).stats;
  const afterD = derive(own.filter((e) => e.date <= end), S.nodes);
  const after = afterD.stats;
  const evs = afterD.events.filter((e) => e.date >= start && e.date <= end).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.ts - b.ts));
  const inPeriod = own.filter((e) => e.date >= start && e.date <= end);
  const deltas = STATS.map((s) => ({ s, v: after[s] - before[s] })).sort((a, b) => b.v - a.v);
  const top = deltas[0] && deltas[0].v > 0 ? deltas[0] : null;
  const fav = [...inPeriod].sort((a, b) => (b.mood || 0) - (a.mood || 0) || (b.photoIds || []).length - (a.photoIds || []).length || (b.text || '').length - (a.text || '').length)[0];
  const unlocks = evs.filter((e) => e.kind === 'unlock').length;
  const levels = evs.filter((e) => e.kind === 'level').length;
  const maxDelta = Math.max(1, ...deltas.map((x) => x.v));

  return `${topbar('Character Recap', { back: true, fallback: '#/sheet' })}
  <div class="page recap">
    <div class="seg small-seg"><a class="${mode === 'month' ? 'on' : ''}" href="#/recap?p=month">Monthly</a><a class="${mode === 'year' ? 'on' : ''}" href="#/recap?p=year">Yearly</a></div>
    <div class="period"><a class="icon-btn" href="#/recap?p=${mode}&d=${prevK}" aria-label="Previous">${icon('left')}</a><h2 class="serif">${label}</h2>${canNext ? `<a class="icon-btn" href="#/recap?p=${mode}&d=${nextK}" aria-label="Next">${icon('right')}</a>` : '<span class="icon-btn ghosted"></span>'}</div>
    ${!inPeriod.length && !evs.length ? emptyState('A quiet chapter', `No entries in ${label}. That's okay: rest is part of every story.`) : `
    <div class="totals">
      <div class="tot"><b>${unlocks}</b><span>Unlocked</span></div>
      <div class="tot"><b>${levels}</b><span>Level-ups</span></div>
      <div class="tot"><b>${inPeriod.length}</b><span>Entries</span></div>
    </div>
    <div class="card grew">
      <div class="kicker">Stat that grew most</div>
      ${top ? `<div class="grew-top"><span class="serif">${top.s}</span><b>+${Math.round(top.v * 10) / 10}</b></div>
      <div class="stat-list mini">${deltas.map((x) => `<div class="stat-row"><span class="sr-name">${x.s}</span><span class="sr-bar"><i style="width:${(Math.max(0, x.v) / maxDelta) * 100}%"></i></span><span class="sr-val">+${Math.round(x.v)}</span></div>`).join('')}</div>`
        : `<p class="muted">No stat changes this ${mode}. Free entries still count as part of your story.</p>`}
    </div>
    ${fav ? `<section><h2 class="sec-h">${icon('sparkle')} Favourite entry</h2><div class="fav">${entryCard(fav)}</div></section>` : ''}
    ${evs.length ? `<section><h2 class="sec-h">Timeline</h2><ol class="timeline">${evs.map((ev) => { const n = nodeById(ev.nodeId); return `<li class="ty-${n.type}"><span class="tl-dot">${icon(n.type)}</span><a href="#/node/${n.id}"><b>${esc(n.title)}</b><span>${ev.kind === 'level' ? `Reached Level ${ev.level}` : 'Unlocked'} · ${fmtDate(ev.date, { day: 'numeric', month: 'short' })}</span></a></li>`; }).join('')}</ol></section>` : ''}
    `}
  </div>`;
}

/* ================= SETTINGS ================= */
function vSettings() {
  const s = S.settings;
  const html = `${topbar('Settings', { back: true, fallback: '#/' })}
  <div class="page settings">
    <section class="card"><h2 class="sec-h">Character</h2>
      <label class="field"><span>Name</span><input class="input" id="set-name" value="${esc(S.profile.name)}" maxlength="40"></label>
    </section>
    <section class="card"><h2 class="sec-h">Appearance</h2>
      <div class="seg" id="theme-seg">${['system', 'light', 'dark'].map((t) => `<button class="${s.theme === t ? 'on' : ''}" data-theme="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>
    </section>
    <section class="card"><h2 class="sec-h">Privacy</h2>
      <p class="muted small">Your journal is private by default. It lives only on this device and nothing is uploaded anywhere.</p>
      <div class="set-row"><div><b>App lock</b><span class="muted small">${s.pinHash ? 'A PIN is required to open Questline.' : 'Require a PIN to open the app.'}</span></div><button class="btn ghost small" id="pin-btn">${s.pinHash ? 'Remove' : 'Set PIN'}</button></div>
    </section>
    <section class="card"><h2 class="sec-h">Reminders</h2>
      <div class="set-row"><div><b>Weekly reflection</b><span class="muted small">A gentle "What did you do this week?" prompt. Only if you haven't written in a week. Never a streak, never a guilt trip.</span></div><label class="switch"><input type="checkbox" id="rem" ${s.reminders ? 'checked' : ''}><i></i></label></div>
    </section>
    <section class="card" id="packs"><h2 class="sec-h">Starter templates</h2>
      <p class="muted small">Add a pre-built tree. You can edit or delete any node afterwards.</p>
      <div class="list">${PACKS.map((p) => { const added = S.trees.some((t) => t.pack === p.id); return `<div class="set-row"><div><b>${p.name}${p.isNew && !added ? ' <span class="beta">new</span>' : ''}</b><span class="muted small">${p.blurb}${added ? ' · ✓ Added' : ''}</span></div><button class="btn ${added ? 'ghost' : 'primary'} small" data-pack="${p.id}">${added ? 'Add again' : 'Add'}</button></div>`; }).join('')}</div>
    </section>
    <section class="card"><h2 class="sec-h">Shared trees <span class="beta">optional</span></h2>
      <div class="set-row"><div><b>Enable shared trees</b><span class="muted small">Unlock a bucket list together with a partner or friends by swapping tree files. Off by default; everything else stays private.</span></div><label class="switch"><input type="checkbox" id="social" ${s.social ? 'checked' : ''}><i></i></label></div>
      ${s.social ? `<button class="btn ghost block" id="imp-tree">${icon('download')} Import a shared tree file</button><p class="muted small">To share one of your trees: open it in Skill Tree → Manage → Make this a shared tree.</p>` : ''}
    </section>
    <section class="card"><h2 class="sec-h">Backup</h2>
      <p class="muted small">Because everything stays on this device, download a backup now and then (photos included). ${s.lastBackup ? `Last backup: ${new Date(s.lastBackup).toLocaleDateString()}.` : 'No backup yet.'}</p>
      <div class="row-btns"><button class="btn ghost" id="exp">${icon('download')} Export</button><button class="btn ghost" id="imp">${icon('upload')} Restore</button></div>
    </section>
    <section class="card"><h2 class="sec-h">App</h2>
      <div class="set-row"><div><b>Install on this device</b><span class="muted small">Adds Questline to your home screen and works fully offline.</span></div><button class="btn ghost small" id="inst">Install</button></div>
      <div class="set-row"><div><b>Erase everything</b><span class="muted small">Deletes all trees, entries and photos from this device.</span></div><button class="btn danger ghost small" id="wipe">Erase</button></div>
    </section>
    <p class="muted small center">Questline · a journal that levels you up</p>
  </div>`;
  return {
    html,
    mount(root) {
      $('#set-name', root).addEventListener('change', (e) => { S.profile.name = e.target.value.trim(); persist(); toast('Name saved'); });
      $$('#theme-seg button', root).forEach((b) => b.addEventListener('click', () => { S.settings.theme = b.dataset.theme; persist(); applyTheme(); render(); }));
      $('#pin-btn', root).addEventListener('click', async () => {
        if (S.settings.pinHash) { S.settings.pinHash = null; S.settings.pinSalt = null; persist(); render(); toast('App lock removed'); return; }
        const pin = await promptDialog('Choose a 4–6 digit PIN', '', { ok: 'Set PIN', placeholder: '••••' });
        if (!pin) return;
        if (!/^\d{4,6}$/.test(pin)) { toast('Use 4 to 6 digits'); return; }
        S.settings.pinSalt = uid();
        S.settings.pinHash = await hashPin(pin, S.settings.pinSalt);
        persist(); render(); toast('App lock on');
      });
      $('#rem', root).addEventListener('change', async (e) => { await setReminders(e.target.checked); render(); toast(e.target.checked ? 'Weekly reflection on' : 'Reminders off'); });
      $$('[data-pack]', root).forEach((b) => b.addEventListener('click', () => {
        const p = PACKS.find((x) => x.id === b.dataset.pack);
        const t = installPack(p); persist(); toast(`Added "${p.name}"`); go('#/tree?t=' + t.id);
      }));
      $('#social', root).addEventListener('change', (e) => { S.settings.social = e.target.checked; persist(); render(); });
      const it = $('#imp-tree', root); if (it) it.addEventListener('click', importSharedTree);
      $('#exp', root).addEventListener('click', exportBackup);
      $('#imp', root).addEventListener('click', importBackup);
      $('#inst', root).addEventListener('click', promptInstall);
      $('#wipe', root).addEventListener('click', async () => {
        if (!(await confirmDialog('Erase your whole journal from this device? This cannot be undone.', { ok: 'Erase everything' }))) return;
        await clearAllData();
        S = freshState(); persist(); applyTheme(); go('#/onboard', true); render();
      });
      if (location.hash.includes('s=packs')) { const p = $('#packs', root); if (p) p.scrollIntoView(); }
    }
  };
}

/* ================= ONBOARDING ================= */
const OB = { step: 0, name: '', packs: new Set() };
function vOnboard() {
  if (S.profile.onboarded) { setTimeout(() => go('#/', true)); return ''; }
  let body = '';
  if (OB.step === 0) {
    body = `<div class="ob-hero">${LOGO}<h1 class="serif">Questline</h1><p class="pitch">A journal that levels you up: turn your bucket list into a skill tree, and every entry is proof you've grown.</p></div>
      <ul class="ob-points"><li>${icon('experience')}<span><b>Build a skill tree</b> of the skills, experiences and knowledge you want.</span></li>
      <li>${icon('edit')}<span><b>Write to unlock.</b> No ticking boxes: a journal entry is your proof.</span></li>
      <li>${icon('skill')}<span><b>Watch your character grow.</b> Stats are earned, never typed in.</span></li>
      <li>${icon('lock')}<span><b>Private.</b> Everything stays on this device.</span></li></ul>
      <form id="ob-form"><label class="field"><span>What should we call your character?</span><input class="input" id="ob-name" value="${esc(OB.name)}" placeholder="Your name" maxlength="40" required></label><button class="btn primary block">Continue</button></form>`;
  } else {
    body = `<h1 class="serif ob-h">Choose your starting paths</h1><p class="muted">Pick 1–3 starter packs to fill your first trees. You can edit or delete anything later.</p>
      <div class="packs">${PACKS.map((p) => `<button class="pack ${OB.packs.has(p.id) ? 'on' : ''}" data-pack="${p.id}"><span class="pk-check">${icon('check')}</span><b>${p.name}</b><span>${p.blurb}</span><small>${p.nodes.length} nodes · ${p.nodes.filter((n) => n[2] === 'skill').length} skills</small></button>`).join('')}</div>
      <div class="ob-actions"><button class="btn ghost" id="ob-back">Back</button><button class="btn primary grow" id="ob-go" ${OB.packs.size ? '' : 'disabled'}>Begin your adventure</button></div>
      <button class="linkish" id="ob-blank">Start with a blank tree instead</button>`;
  }
  return {
    html: `<div class="page onboard">${body}</div>`,
    noTabs: true,
    mount(root) {
      const f = $('#ob-form', root);
      if (f) f.addEventListener('submit', (e) => { e.preventDefault(); OB.name = $('#ob-name', root).value.trim(); if (!OB.name) return; OB.step = 1; render(); });
      $$('[data-pack]', root).forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.pack;
        if (OB.packs.has(id)) OB.packs.delete(id);
        else if (OB.packs.size < 3) OB.packs.add(id);
        else toast('Pick up to 3 to start. You can add more later in Settings.');
        render();
      }));
      const back = $('#ob-back', root); if (back) back.addEventListener('click', () => { OB.step = 0; render(); });
      const finish = (packs) => {
        S.profile.name = OB.name;
        S.profile.onboarded = true;
        if (packs.length) packs.forEach((id) => installPack(PACKS.find((p) => p.id === id)));
        else S.trees.push({ id: uid(), name: 'My Quests', createdAt: Date.now(), shared: false, members: [] });
        S.ui.lastTree = S.trees[0].id;
        persist();
        go('#/', true);
        toast('Your adventure begins');
      };
      const g = $('#ob-go', root); if (g) g.addEventListener('click', () => finish([...OB.packs]));
      const bl = $('#ob-blank', root); if (bl) bl.addEventListener('click', () => finish([]));
    }
  };
}

function vNotFound() {
  return `${topbar('Not found', { back: true })}<div class="page">${emptyState('Nothing here', 'That page may have been deleted.', `<a class="btn primary" href="#/">Home</a>`)}</div>`;
}
