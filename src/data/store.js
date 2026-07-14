// Data store wrapper for @zos/storage.
// All keys are namespaced under 'qp.*' and versioned for migration.
//
// BUKTI WATCH b4 (foto 2026-07-14): `localStorage.getItem` = "TypeError: not a
// function" di runtime apiVersion 3.0 — instance `localStorage` TIDAK diberi
// @version di d.ts, sedangkan class `LocalStorage` eksplisit @version 3.0.
// Maka backend utama = new LocalStorage(); instance kecil jadi cadangan; kalau
// dua-duanya mati, store jadi no-op yang mengembalikan default — TIDAK PERNAH
// melempar ke pemanggil (kematian b3: storeGet melempar di onInit reader).
//
// Juga: HANYA console.log di file ini. console.error/warn tidak terbukti ada
// di runtime — throw di dalam catch adalah cara b3 mati.

import { localStorage, LocalStorage } from '@zos/storage'

let _backend = null
let _backendName = ''

function backend() {
  if (_backendName) return _backend
  try {
    const ls = new LocalStorage()
    if (ls && typeof ls.getItem === 'function') {
      _backend = ls
      _backendName = 'class'
      return _backend
    }
  } catch (e) {
    console.log('[Store] LocalStorage class unavailable: ' + e)
  }
  try {
    if (localStorage && typeof localStorage.getItem === 'function') {
      _backend = localStorage
      _backendName = 'instance'
      return _backend
    }
  } catch (e) {
    console.log('[Store] localStorage instance unavailable: ' + e)
  }
  _backend = null
  _backendName = 'none'
  return _backend
}

export function getBackendName() {
  backend()
  return _backendName
}

const STORE_PREFIX = 'qp.'
const STORE_VERSION = 1

/**
 * Storage schema definitions with version.
 * Format: key: { version, default, migration }
 */
const SCHEMA = {
  settings: {
    version: 1,
    default: {
      lang: 'id',
      reciter: 'default',
      calcMethod: 'kemenag',
      madhab: 'shafii',
      ihtiyat: 2,
      hijriOffset: 0,
      notify: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
      keepScreenOn: false,
      theme: 'dark',
      mushafSize: 21,
    },
  },
  lastRead: {
    version: 1,
    default: {
      surah: 1,
      ayah: 1,
      page: 1,
      ts: 0,
    },
  },
  bookmarks: {
    version: 1,
    default: [],
    migration: (data) => {
      // Ensure array structure
      return Array.isArray(data) ? data : []
    },
  },
  favorites: {
    version: 1,
    default: [],
    migration: (data) => {
      // Ensure array structure
      return Array.isArray(data) ? data : []
    },
  },
  tasbih: {
    version: 1,
    default: {
      count: 0,
      target: 99,
      preset: '99',
      ts: 0,
    },
  },
  location: {
    version: 1,
    default: {
      lat: 0,
      lon: 0,
      city: '',
      ts: 0,
      source: 'gps',
    },
  },
}

/**
 * Get namespaced key.
 */
function nsKey(key) {
  return `${STORE_PREFIX}${key}.v${STORE_VERSION}`
}

/**
 * Get value from localStorage.
 * @param {string} key - Storage key (without prefix)
 * @returns {any} Stored value or default
 */
export function get(key) {
  const schema = SCHEMA[key]
  if (!schema) {
    console.log(`[Store] Unknown key: ${key}`)
    return null
  }

  try {
    const be = backend()
    if (!be) return schema.default

    const raw = be.getItem(nsKey(key))
    if (raw === null || raw === undefined || raw === '') {
      return schema.default
    }

    const parsed = JSON.parse(raw)

    // Run migration if needed
    if (schema.migration) {
      return schema.migration(parsed)
    }

    return parsed
  } catch (e) {
    console.log(`[Store] Error reading ${key}: ` + e)
    return schema.default
  }
}

/**
 * Set value in localStorage.
 * @param {string} key - Storage key (without prefix)
 * @param {any} value - Value to store
 */
export function set(key, value) {
  const schema = SCHEMA[key]
  if (!schema) {
    console.log(`[Store] Unknown key: ${key}`)
    return
  }

  try {
    const be = backend()
    if (!be) return
    be.setItem(nsKey(key), JSON.stringify(value))
  } catch (e) {
    console.log(`[Store] Error writing ${key}: ` + e)
  }
}

/**
 * Delete a key from storage.
 * @param {string} key - Storage key (without prefix)
 */
export function del(key) {
  try {
    const be = backend()
    if (!be) return
    be.removeItem(nsKey(key))
  } catch (e) {
    console.log(`[Store] Error deleting ${key}: ` + e)
  }
}

/**
 * Clear all app data (for testing or reset).
 */
export function clear() {
  Object.keys(SCHEMA).forEach(key => {
    del(key)
  })
}

/**
 * Get store version.
 */
export function getVersion() {
  return STORE_VERSION
}
