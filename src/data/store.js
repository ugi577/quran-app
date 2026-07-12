// Data store wrapper for @zos/storage localStorage
// All keys are namespaced under 'qp.*' and versioned for migration.

import { localStorage } from '@zos/storage'

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
    console.warn(`[Store] Unknown key: ${key}`)
    return null
  }

  try {
    const raw = localStorage.getItem(nsKey(key))
    if (raw === null || raw === '') {
      return schema.default
    }

    const parsed = JSON.parse(raw)

    // Run migration if needed
    if (schema.migration) {
      return schema.migration(parsed)
    }

    return parsed
  } catch (e) {
    console.error(`[Store] Error reading ${key}:`, e)
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
    console.warn(`[Store] Unknown key: ${key}`)
    return
  }

  try {
    localStorage.setItem(nsKey(key), JSON.stringify(value))
  } catch (e) {
    console.error(`[Store] Error writing ${key}:`, e)
  }
}

/**
 * Delete a key from localStorage.
 * @param {string} key - Storage key (without prefix)
 */
export function del(key) {
  try {
    localStorage.removeItem(nsKey(key))
  } catch (e) {
    console.error(`[Store] Error deleting ${key}:`, e)
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
