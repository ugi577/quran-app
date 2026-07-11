// Penyimpanan lokal — Quran App
//
// Wrapper di atas `@zos/storage` (izin device:os.local_storage).
// Menyimpan: settings, lastPage, bookmarks, favorites, tasbih.
// Semua nilai di-serialize ke JSON. Aman dipanggil kapan saja (try/catch).

import { localStorage } from "@zos/storage";

const PREFIX = "quran:";

function _read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === undefined || raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function _write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    // abaikan kegagalan storage (mis. quota); state tetap di memori selama sesi
  }
  return true;
}

export const settings = {
  get: (fallback = {}) => _read("settings", fallback),
  set: (v) => _write("settings", v),
};

export const lastPage = {
  get: () => {
    const v = _read("lastPage", 1);
    return typeof v === "number" && v >= 1 ? v : 1;
  },
  set: (p) => _write("lastPage", p | 0),
};

export const bookmarks = {
  get: () => _read("bookmarks", []),
  has: (page) => _read("bookmarks", []).indexOf(page | 0) !== -1,
  toggle: (page) => {
    const p = page | 0;
    const list = _read("bookmarks", []);
    const i = list.indexOf(p);
    if (i === -1) list.push(p);
    else list.splice(i, 1);
    _write("bookmarks", list);
    return i === -1; // true = baru ditambah
  },
};

export const favorites = {
  get: () => _read("favorites", []),
  has: (id) => _read("favorites", []).indexOf(id) !== -1,
  toggle: (id) => {
    const list = _read("favorites", []);
    const i = list.indexOf(id);
    if (i === -1) list.push(id);
    else list.splice(i, 1);
    _write("favorites", list);
    return i === -1;
  },
};

export const tasbih = {
  get: () => _read("tasbih", { count: 0, targetIdx: 0, dhikrIdx: 0, total: 0, sessions: [] }),
  set: (v) => _write("tasbih", v),
};

// Pastikan struktur default ada (dipanggil dari app.onCreate)
export function init() {
  if (_read("settings", null) === null) _write("settings", {});
  return true;
}

export default { settings, lastPage, bookmarks, favorites, tasbih, init };
