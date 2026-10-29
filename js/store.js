'use strict';
/* IndexedDB storage: one 'kv' store (app state, reminder info) and one 'photos' store (image Blobs). */
const DB_NAME = 'questline', DB_VER = 1;
let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos');
    };
    r.onsuccess = () => { _db = r.result; resolve(_db); };
    r.onerror = () => reject(r.error);
  });
}

function idb(store, mode, fn) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

const kvGet = (k) => idb('kv', 'readonly', (s) => s.get(k));
const kvSet = (k, v) => idb('kv', 'readwrite', (s) => s.put(v, k));
const photoGet = (id) => idb('photos', 'readonly', (s) => s.get(id));
const photoPut = (id, blob) => idb('photos', 'readwrite', (s) => s.put(blob, id));
const photoDel = (id) => idb('photos', 'readwrite', (s) => s.delete(id));
const photoKeys = () => idb('photos', 'readonly', (s) => s.getAllKeys());
const clearAllData = () => Promise.all([
  idb('kv', 'readwrite', (s) => s.clear()),
  idb('photos', 'readwrite', (s) => s.clear())
]);

/* Object URLs for stored photos, cached for the session. */
const _photoURLs = new Map();
async function photoURL(id) {
  if (_photoURLs.has(id)) return _photoURLs.get(id);
  const blob = await photoGet(id);
  if (!blob) return '';
  const url = URL.createObjectURL(blob);
  _photoURLs.set(id, url);
  return url;
}
function forgetPhotoURL(id) {
  const u = _photoURLs.get(id);
  if (u) URL.revokeObjectURL(u);
  _photoURLs.delete(id);
}

/* Downscale a picked image to keep storage small (JPEG, longest side 1600px). */
async function resizeImage(file, max = 1600, quality = 0.82) {
  let src, w, h;
  try {
    src = await createImageBitmap(file);
    w = src.width; h = src.height;
  } catch (e) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    src = img; w = img.naturalWidth; h = img.naturalHeight;
  }
  const scale = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b || file), 'image/jpeg', quality));
}

const blobToDataURL = (blob) => new Promise((res, rej) => {
  const fr = new FileReader();
  fr.onload = () => res(fr.result);
  fr.onerror = () => rej(fr.error);
  fr.readAsDataURL(blob);
});
const dataURLToBlob = (url) => fetch(url).then((r) => r.blob());
