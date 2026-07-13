// Quran Reader — windowed stacked-TEXT + native layer scroll.
// Per DECISIONS D-001 (RENDER-B: scrollable TEXT widgets). Every widget/event
// here is proven on this watch by ~/Projects/quran-app (same device, API 3.0).
// SCROLL_LIST is NOT used for ayat: multi-line wrapped Arabic inside its
// text_view is undocumented/unproven — see DECISIONS entry batch-b reader.
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { push, replace, back } from '@zos/router'
import { C, F } from './theme'
import { getSurah } from '../src/data/quran'
import { set as storeSet, get as storeGet } from '../src/data/store'

// ── Layout constants (quran-app proven: PAD 50 / W 366 on this 466 round) ──
const PADX = 50
const W_TXT = 366
const GAP = 16
const NUM_ROW_H = 30

// Window sizing: partition by estimated height so Al-Baqarah never builds
// hundreds of widgets at once (AGENTS.md banned pattern #4).
const WIN_CAP = 2600 // est px of ayat content per window
const WIN_MAX = 20 // hard cap ayat per window
const LINE_EST = 50 // est line height at text_size 32
const WPL_EST = 4 // est words per line at W_TXT

// ── Module state (QJSC-safe: no closures stored in arrays) ──
let _sn = 1 // surah 1..114
let _ayah = 1 // first ayah to show
let _renderedOK = false // lastRead is only written for a surah that rendered

function toArabicNum(n) {
  const D = '٠١٢٣٤٥٦٧٨٩'
  const s = String(n)
  let out = ''
  for (let i = 0; i < s.length; i++) out += D[s.charCodeAt(i) - 48]
  return out
}

function estAyahH(text) {
  const words = text.trim().split(/\s+/).length
  const lines = Math.max(1, Math.ceil(words / WPL_EST))
  return lines * LINE_EST + NUM_ROW_H + GAP
}

// Real wrapped height from the layout engine (getTextLayout: device-types
// index.d.ts:10240). Falls back to the estimate if the engine returns nothing.
function textH(text, size) {
  let h = 0
  try {
    const r = hmUI.getTextLayout(text, { text_size: size, text_width: W_TXT, wrapped: 1 })
    if (r && r.height > 0) h = r.height
  } catch (e) { /* fall through to estimate */ }
  if (!h) h = Math.max(LINE_EST, estAyahH(text) - NUM_ROW_H - GAP)
  return h + 10
}

// Deterministic forward partition: window start indexes into ayat[].
function computeWindows(ayat) {
  const wins = []
  let acc = 0
  let count = 0
  for (let i = 0; i < ayat.length; i++) {
    const h = estAyahH(ayat[i].arab)
    if (count === 0 || acc + h > WIN_CAP || count >= WIN_MAX) {
      wins.push(i)
      acc = h
      count = 1
    } else {
      acc += h
      count++
    }
  }
  return wins
}

function windowIndexFor(wins, ayatIdx) {
  let w = 0
  for (let i = 0; i < wins.length; i++) {
    if (wins[i] <= ayatIdx) w = i
    else break
  }
  return w
}

function saveLastRead() {
  storeSet('lastRead', { surah: _sn, ayah: _ayah, page: 1, ts: Date.now() })
}

// No saveLastRead here: writing before the target renders poisons Continue —
// one crashing surah would trap every later open on that surah.
function gotoReader(surahNum, ayahNum) {
  replace({ url: 'page/reader', params: JSON.stringify({ surahNum, ayahNum }) })
}

// ── Widget helpers (top widget receives the touch — batch-b lesson) ──
function label(text, x, y, w, h, color, size, wrap) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(x), y: px(y), w: px(w), h: px(h), color,
    text_size: size,
    text,
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: wrap ? hmUI.text_style.WRAP : hmUI.text_style.NONE,
  })
}

function fill(x, y, w, h, color) {
  return hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: px(x), y: px(y), w: px(w), h: px(h), color,
  })
}

function chip(x, y, w, h, ch, color, cb) {
  fill(x, y, w, h, C.surface)
  const t = label(ch, x, y, w, h, color, 30, false)
  t.addEventListener(hmUI.event.CLICK_DOWN, cb)
  return t
}

Page({
  onInit(params) {
    _sn = 0
    _ayah = 1
    _renderedOK = false
    try {
      const p = typeof params === 'string' ? JSON.parse(params) : params
      if (p && p.surahNum) {
        _sn = Number(p.surahNum) || 0
        _ayah = Number(p.ayahNum) || 1
      }
    } catch (e) { /* bad params → lastRead below */ }
    if (!_sn) {
      const lr = storeGet('lastRead')
      _sn = (lr && lr.surah) || 1
      _ayah = (lr && lr.ayah) || 1
    }
    if (_sn < 1 || _sn > 114) _sn = 1
  },

  build() {
    hmUI.setLayerScrolling(true)
    fill(0, 0, 466, 466, C.bg)

    const surah = getSurah(_sn)
    if (!surah || !surah.ayat || surah.ayat.length === 0) {
      label('Surah ' + _sn + ' tidak tersedia', 50, 160, 366, 60, C.gold, F.body, true)
      chip(125, 260, 100, 56, '↩', C.textHi, function () { back() })
      chip(241, 260, 100, 56, '١', C.gold, function () { gotoReader(1, 1) })
      return
    }

    const ayat = surah.ayat
    const n = ayat.length
    const wins = computeWindows(ayat)

    if (_ayah < 1 || _ayah > n) _ayah = 1
    let targetIdx = 0
    for (let i = 0; i < n; i++) {
      if (ayat[i].nomor === _ayah) { targetIdx = i; break }
    }
    const wi = windowIndexFor(wins, targetIdx)
    const startI = wins[wi]
    const endI = wi + 1 < wins.length ? wins[wi + 1] - 1 : n - 1
    _ayah = ayat[startI].nomor

    const prevSn = _sn > 1 ? _sn - 1 : 114
    const nextSn = _sn < 114 ? _sn + 1 : 1

    // ── Header (scrolls with content, quran-app model) ──
    let y = 22
    label(surah.namaLatin || 'Surah ' + _sn, 0, y, 466, 38, C.gold, F.h2, false)
    y += 40
    label(surah.nama || '', 0, y, 466, 30, C.goldDim, F.label, false)
    y += 32
    label(ayat[startI].nomor + '–' + ayat[endI].nomor + ' / ' + n, 0, y, 466, 24, C.textLo, F.caption, false)
    y += 30

    chip(80, y, 56, 48, '◄', C.gold, function () { gotoReader(prevSn, 1) })
    chip(330, y, 56, 48, '►', C.gold, function () { gotoReader(nextSn, 1) })
    label(_sn + ' / 114', 156, y, 154, 48, C.textLo, F.caption, false)
    y += 60

    fill(PADX, y, W_TXT, 1, C.strokeGold)
    y += 10

    // ── Basmalah (mushaf rule: every surah except 1 and 9, first window only)
    // Text comes from surah 1 ayah 1 — the frozen, tashih-covered source.
    if (wi === 0 && _sn !== 1 && _sn !== 9) {
      const fatihah = getSurah(1)
      if (fatihah && fatihah.ayat && fatihah.ayat[0]) {
        const bText = fatihah.ayat[0].arab
        const bH = textH(bText, F.basmalah)
        label(bText, PADX, y, W_TXT, bH, C.gold, F.basmalah, true)
        y += bH + 12
      }
    }

    // ── Continue-up (previous window) ──
    if (wi > 0) {
      const upAyah = ayat[wins[wi - 1]].nomor
      chip(173, y, 120, 48, '▲', C.gold, function () { gotoReader(_sn, upAyah) })
      y += 60
    }

    // ── Ayat ──
    for (let i = startI; i <= endI; i++) {
      const a = ayat[i]
      label('﴿ ' + toArabicNum(a.nomor) + ' ﴾', 0, y, 466, 28, C.gold, F.caption, false)
      y += NUM_ROW_H
      const h = textH(a.arab, F.quran)
      label(a.arab, PADX, y, W_TXT, h, C.textHi, F.quran, true)
      y += h + GAP
    }

    // ── Footer ──
    y += 8
    if (wi + 1 < wins.length) {
      const dnAyah = ayat[wins[wi + 1]].nomor
      chip(153, y, 160, 56, '▼', C.gold, function () { gotoReader(_sn, dnAyah) })
      y += 68
    }

    chip(105, y, 56, 56, '◄', C.gold, function () { gotoReader(prevSn, 1) })
    chip(205, y, 56, 56, '↩', C.textHi, function () { back() })
    chip(305, y, 56, 56, '►', C.gold, function () { gotoReader(nextSn, 1) })
    y += 68

    fill(0, y, 466, 24, C.bg) // bottom breathing room for the scroll extent

    _renderedOK = true
    saveLastRead()
  },

  onDestroy() {
    if (_renderedOK) saveLastRead()
  },
})
