// Quran data loader and cache
// - surah index: loaded once via static require (small, always needed)
// - per-surah JSON: lazy-loaded via @zos/fs openAssetsSync (avoids dynamic require issues)
import { openAssetsSync, statAssetsSync, readSync, closeSync, O_RDONLY } from '@zos/fs'

// --- Cache (LRU, max 3 surahs) ---
const CACHE_MAX = 3
const surahCache = [] // { number, timestamp, data }

// Decode UTF-8 bytes to a string.
// String.fromCharCode per byte would be latin1 — Arabic is 2 bytes per letter
// (U+0600–U+06FF), so that splits every letter into two junk characters.
//
// Code units accumulate as NUMBERS in a small buffer flushed via
// String.fromCharCode.apply per 4096 units. The previous version pushed one
// 1-char STRING per character — ~190k string objects for Al-Baqarah's 197KB,
// several MB of transient heap → the OS killed the page before first paint.
// (Chunked .apply is the pipeline quran-app has proven on this watch.)
function utf8Decode(uint8) {
  const len = uint8.length
  const buf = []
  let out = ''
  let i = 0
  while (i < len) {
    const b1 = uint8[i++]
    if (b1 < 0x80) {
      buf.push(b1)
    } else if ((b1 & 0xE0) === 0xC0) {
      buf.push(((b1 & 0x1F) << 6) | (uint8[i++] & 0x3F))
    } else if ((b1 & 0xF0) === 0xE0) {
      const b2 = uint8[i++] & 0x3F
      const b3 = uint8[i++] & 0x3F
      buf.push(((b1 & 0x0F) << 12) | (b2 << 6) | b3)
    } else if ((b1 & 0xF8) === 0xF0) {
      const b2 = uint8[i++] & 0x3F
      const b3 = uint8[i++] & 0x3F
      const b4 = uint8[i++] & 0x3F
      const cp = (((b1 & 0x07) << 18) | (b2 << 12) | (b3 << 6) | b4) - 0x10000
      buf.push(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF))
    }
    // A stray continuation byte in lead position is dropped, not replaced with U+FFFD:
    // losing a character loudly beats emitting a wrong one silently.
    if (buf.length >= 4096) {
      out += String.fromCharCode.apply(null, buf)
      buf.length = 0
    }
  }
  if (buf.length) out += String.fromCharCode.apply(null, buf)
  return out
}

// Read a text file from /assets and return its contents as a string.
// Path is relative to /assets, e.g. "data/quran/1.json"
function readAssetText(assetPath) {
  try {
    const stat = statAssetsSync({ path: assetPath })
    if (!stat || stat.size === 0) {
      console.log(`[Quran] statAssetsSync failed for: ${assetPath}`)
      return null
    }

    const fd = openAssetsSync({ path: assetPath, flag: O_RDONLY })
    if (fd === undefined || fd < 0) {
      console.log(`[Quran] openAssetsSync failed for: ${assetPath}`)
      return null
    }

    const buffer = new ArrayBuffer(stat.size)
    const bytesRead = readSync({ fd, buffer })
    closeSync({ fd })

    if (bytesRead !== stat.size) {
      console.log(`[Quran] Short read: ${bytesRead}/${stat.size} for ${assetPath}`)
    }

    return utf8Decode(new Uint8Array(buffer))
  } catch (e) {
    console.log(`[Quran] readAssetText error for ${assetPath}:`, e)
    return null
  }
}

// --- Public API ---

/**
 * Get surah index (metadata for all 114 surahs).
 * Loaded once from the assets filesystem (same proven path as getSurah) —
 * runtime require() of an asset JSON is unverified on-device (finding #6).
 */
let surahIndex = null

export function getSurahIndex() {
  if (surahIndex) return surahIndex
  const json = readAssetText('raw/data/quran/index.json')
  if (!json) {
    console.log('[Quran] Failed to read surah index')
    return []
  }
  try {
    surahIndex = JSON.parse(json)
    console.log(`[Quran] Surah index loaded: ${surahIndex.length} surahs`)
    return surahIndex
  } catch (e) {
    console.log('[Quran] Surah index JSON parse error:', e)
    return []
  }
}

/**
 * Get a single surah by number (1-114).
 * Lazy-loads from bundled assets filesystem, cached in memory (LRU, max 3).
 */
export function getSurah(num) {
  if (num < 1 || num > 114) {
    console.log(`[Quran] Invalid surah number: ${num}`)
    return null
  }

  // Check cache
  const cached = surahCache.find(c => c.number === num)
  if (cached) {
    cached.timestamp = Date.now()
    return cached.data
  }

  // Load from assets filesystem
  const path = `raw/data/quran/${num}.json`
  console.log(`[Quran] Loading surah ${num} from ${path}`)
  const json = readAssetText(path)
  if (!json) {
    console.log(`[Quran] Failed to read surah ${num}`)
    return null
  }

  try {
    const surah = JSON.parse(json)
    addToCache(num, surah)
    console.log(`[Quran] Surah ${num} loaded: "${surah.namaLatin}" (${surah.jumlahAyat} ayat)`)
    return surah
  } catch (e) {
    console.log(`[Quran] JSON parse error for surah ${num}:`, e)
    return null
  }
}

/**
 * Get a specific ayah from a surah.
 */
export function getAyah(surahNum, ayahNum) {
  const surah = getSurah(surahNum)
  if (!surah || !surah.ayat) return null
  return surah.ayat.find(a => a.nomor === ayahNum) || null
}

// --- Cache internals ---

function addToCache(num, data) {
  const idx = surahCache.findIndex(c => c.number === num)
  if (idx >= 0) surahCache.splice(idx, 1)

  surahCache.push({ number: num, timestamp: Date.now(), data })

  // Evict oldest if over limit
  if (surahCache.length > CACHE_MAX) {
    let oldestIdx = 0
    let oldestTs = surahCache[0].timestamp
    for (let i = 1; i < surahCache.length; i++) {
      if (surahCache[i].timestamp < oldestTs) {
        oldestTs = surahCache[i].timestamp
        oldestIdx = i
      }
    }
    const evicted = surahCache.splice(oldestIdx, 1)[0]
    console.log(`[Quran] Cache evicted: surah ${evicted.number}`)
  }
}

export function clearCache() {
  surahCache.length = 0
}

export function getCacheStatus() {
  return {
    size: surahCache.length,
    max: CACHE_MAX,
    items: surahCache.map(c => c.number),
  }
}
