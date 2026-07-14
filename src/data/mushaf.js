// Madinah Mushaf page loader — 604 pages, 15 lines each, word-level data.
// Each page file: { page, juz, lines: [{ n, words: [{ t, s, a }] }] }
// t = Arabic text, s = surah number, a = ayah number
import { openAssetsSync, statAssetsSync, readSync, closeSync, O_RDONLY } from '@zos/fs'

// UTF-8 decoder (chunked — same proven pipeline as quran.js)
function utf8Decode(uint8) {
  var len = uint8.length
  var buf = []
  var chunks = []
  var i = 0
  while (i < len) {
    var b1 = uint8[i++]
    if (b1 < 0x80) {
      buf.push(b1)
    } else if ((b1 & 0xE0) === 0xC0) {
      buf.push(((b1 & 0x1F) << 6) | (uint8[i++] & 0x3F))
    } else if ((b1 & 0xF0) === 0xE0) {
      var b2 = uint8[i++] & 0x3F
      var b3 = uint8[i++] & 0x3F
      buf.push(((b1 & 0x0F) << 12) | (b2 << 6) | b3)
    } else if ((b1 & 0xF8) === 0xF0) {
      var b2 = uint8[i++] & 0x3F
      var b3 = uint8[i++] & 0x3F
      var b4 = uint8[i++] & 0x3F
      var cp = (((b1 & 0x07) << 18) | (b2 << 12) | (b3 << 6) | b4) - 0x10000
      buf.push(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF))
    }
    if (buf.length >= 4096) {
      chunks.push(String.fromCharCode.apply(null, buf))
      buf.length = 0
    }
  }
  if (buf.length) chunks.push(String.fromCharCode.apply(null, buf))
  return chunks.join('')
}

function readAssetText(assetPath) {
  try {
    var stat = statAssetsSync({ path: assetPath })
    if (!stat || stat.size === 0) return null
    var fd = openAssetsSync({ path: assetPath, flag: O_RDONLY })
    if (fd === undefined || fd < 0) return null
    var buffer = new ArrayBuffer(stat.size)
    readSync({ fd, buffer })
    closeSync({ fd })
    return utf8Decode(new Uint8Array(buffer))
  } catch (e) {
    console.log('[Mushaf] read error: ' + assetPath)
    return null
  }
}

// Surah → first page lookup (604-page Madinah mushaf)
var SURAH_PAGE = [
  0, 1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262,
  267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499,
  502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577,
  578, 580, 582, 583, 585, 586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599, 600, 600, 601, 601, 601,
  602, 602, 602, 603, 603, 603, 604, 604, 604,
]

/**
 * Get the first mushaf page for a surah (1-114).
 */
export function surahFirstPage(surahNum) {
  if (surahNum < 1 || surahNum > 114) return 1
  return SURAH_PAGE[surahNum] || 1
}

/**
 * Load a single mushaf page by number (1-604).
 * Returns: { page, juz, surah (primary), lines: [{ words: [{t,s,a}] }] }
 */
export function getMushafPage(num) {
  if (num < 1 || num > 604) return null

  var path = 'raw/data/quran/mushaf/' + num + '.json'
  var json = readAssetText(path)
  if (!json) {
    console.log('[Mushaf] Failed to read page ' + num)
    return null
  }

  try {
    var page = JSON.parse(json)
    // Determine primary surah for this page (first word's surah)
    var primarySurah = 0
    for (var i = 0; i < page.lines.length; i++) {
      var ws = page.lines[i].words
      if (ws && ws.length > 0 && ws[0].s) {
        primarySurah = ws[0].s
        break
      }
    }
    page.surah = primarySurah
    return page
  } catch (e) {
    console.log('[Mushaf] JSON parse error page ' + num)
    return null
  }
}
