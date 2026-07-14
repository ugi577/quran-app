// Quran Reader — Madinah Mushaf 604 halaman (per-halaman, word-level)
// Data dari mushaf-index: 15 baris/halaman, kata per kata dengan surah+ayat.
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { replace } from '@zos/router'
import { C, F, BUILD, safeWidth, centerX } from './theme'
import { getMushafPage, surahFirstPage } from '../src/data/mushaf'
import { getSurah, getSurahIndex } from '../src/data/quran'
import { get as storeGet, set as storeSet } from '../src/data/store'

// Layout constants
var PADX = 50
var W_TXT = 366

// Module state
var _page = 1
var _stage = 'boot'
var _mark = null
var _renderedOK = false
var _mushafSize = F.quran

// Lazy-loaded surah name cache (surah number → Arabic name)
var _surahNames = null
function getSurahName(num) {
  if (!_surahNames) {
    _surahNames = {}
    var idx = getSurahIndex()
    for (var i = 0; i < idx.length; i++) {
      _surahNames[idx[i].n] = idx[i].na
    }
  }
  return _surahNames[num] || ''
}

function toArabicNum(n) {
  var D = '٠١٢٣٤٥٦٧٨٩'
  var s = String(n)
  var out = ''
  for (var i = 0; i < s.length; i++) out += D[s.charCodeAt(i) - 48]
  return out
}

function textH(text, size) {
  var effectiveSize = size || _mushafSize || F.quran
  var h = 0
  try {
    var r = hmUI.getTextLayout(text, { text_size: effectiveSize, text_width: W_TXT, wrapped: 1 })
    if (r && r.height > 0) h = r.height
  } catch (e) { /* fall through */ }
  if (!h) h = effectiveSize * 2 * Math.ceil(text.length / Math.floor(W_TXT / (effectiveSize * 0.55)))
  return h + 16
}

function saveLastRead() {
  try {
    storeSet('lastRead', { page: _page, surah: 1, ayah: 1, ts: Date.now() })
  } catch (e) { /* silent */ }
}

function gotoPage(pageNum) {
  replace({ url: 'page/reader', params: JSON.stringify({ page: pageNum }) })
}

function gotoHome() {
  replace({ url: 'page/index' })
}

function stage(s) {
  _stage = s
  try {
    if (_mark) _mark.setProperty(hmUI.prop.TEXT, 'r-' + BUILD + ' ' + s)
  } catch (e) { /* best-effort */ }
}

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
  var t = label(ch, x, y, w, h, color, 28, false)
  t.addEventListener(hmUI.event.CLICK_DOWN, cb)
  return t
}

Page({
  onInit(params) {
    _page = 0
    _renderedOK = false
    try {
      var p = null
      if (params && typeof params === 'object') {
        p = params
      } else if (typeof params === 'string') {
        var s = params.trim()
        if (s && s !== 'undefined' && s !== 'null' && s[0] === '{') {
          p = JSON.parse(s)
        }
      }
      if (p && p.page) {
        _page = Number(p.page) || 0
      } else if (p && p.surahNum) {
        _page = surahFirstPage(Number(p.surahNum) || 1)
      }
    } catch (e) {
      _page = 0
    }
    if (!_page || _page < 1) {
      try {
        var lr = storeGet('lastRead')
        _page = (lr && lr.page) || 1
      } catch (e) {
        _page = 1
      }
    }
    if (!_page || _page < 1 || _page > 604) _page = 1
  },

  build() {
    hmUI.setLayerScrolling(true)
    fill(0, 0, 466, 466, C.bg)
    _mark = label('r-' + BUILD + ' boot', 0, 220, 60, 20, C.textLo, 20, false)

    try {
      var settings = storeGet('settings')
      _mushafSize = (settings && settings.mushafSize) || F.quran

      stage('load' + _page)
      var pageData = getMushafPage(_page)
      if (!pageData || !pageData.lines) {
        stage('nodata')
        label('Halaman ' + _page + ' tidak tersedia', 50, 160, 366, 60, C.gold, F.body, true)
        chip(125, 260, 100, 56, '↩', C.textHi, function () { gotoHome() })
        chip(241, 260, 100, 56, 'الفاتحة', C.gold, function () { gotoPage(1) })
        return
      }

      // -- Build per-line text from words[], one TEXT widget per mushaf line --
      // Ayah markers (١) inserted inline at ayah boundaries within each line.
      var surahOnPage = pageData.surah || 0
      var lineTexts = []  // [{text, isNewSurahTransition}]
      var lastAyah = 0
      var lastSurah = 0

      for (var li = 0; li < pageData.lines.length; li++) {
        var words = pageData.lines[li].words
        if (!words || words.length === 0) {
          lineTexts.push({ text: '', isEmpty: true })
          continue
        }
        var lineText = ''
        var lineHasSurahTransition = false
        for (var wi = 0; wi < words.length; wi++) {
          var w = words[wi]
          if (w.a !== lastAyah || w.s !== lastSurah) {
            if (lastAyah > 0) {
              lineText += ' (' + toArabicNum(lastAyah) + ') '
            }
            if (w.s !== lastSurah && lastSurah > 0) {
              lineHasSurahTransition = true
            }
            lastSurah = w.s
            lastAyah = w.a
          }
          lineText += w.t + ' '
        }
        // Don't add trailing marker — ayah may continue to next line/page
        lineTexts.push({ text: lineText, isEmpty: false, surahTrans: lineHasSurahTransition })
      }

      // -- Header --
      var HDR_Y = 14
      var surahName = getSurahName(surahOnPage)
      label(surahName || '', 0, HDR_Y, 466, 30, C.gold, 30, false)
      label('Hlm ' + _page + '/604', 0, HDR_Y + 28, 466, 20, C.textLo, 20, false)
      fill(PADX, HDR_Y + 52, W_TXT, 1, C.stroke)

      // -- Basmalah: ONLY at first page of a surah (except 1 & 9) --
      // Not every page — check via surahFirstPage lookup.
      var textY = HDR_Y + 62
      var isSurahStart = (surahOnPage > 0 && surahFirstPage(surahOnPage) === _page)
      if (isSurahStart && surahOnPage !== 1 && surahOnPage !== 9) {
        stage('bsm')
        var fatihah = getSurah(1)
        if (fatihah && fatihah.ay && fatihah.ay[0]) {
          var bText = fatihah.ay[0].a
          var bmSize = _mushafSize - 4
          var bH = textH(bText, bmSize)
          label(bText, PADX, textY, W_TXT, bH, C.gold, bmSize, true)
          textY += bH + 8
        }
      }

      // -- Render each mushaf line as a separate TEXT widget --
      stage('text')
      var lineH = Math.round(_mushafSize * 1.7)  // estimated height per visual line
      var totalH = 0
      for (var li2 = 0; li2 < lineTexts.length; li2++) {
        var lt = lineTexts[li2]
        if (lt.isEmpty) {
          // Empty/decorative line — small vertical gap
          textY += Math.round(lineH * 0.5)
          totalH += Math.round(lineH * 0.5)
          continue
        }
        // One data line = one visual row, no reflow/wrap
        var lH = Math.round(_mushafSize * 1.6)
        hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(PADX), y: px(textY), w: px(W_TXT), h: lH,
          color: C.textHi, text_size: _mushafSize,
          text: lt.text,
          align_h: hmUI.align.RIGHT,
          align_v: hmUI.align.CENTER_V,
          text_style: hmUI.text_style.NONE,
        })
        textY += lH + 2
        totalH += lH + 2
      }
      console.log('[mushaf] page ' + _page + ' total height: ' + totalH + 'px, lines: ' + lineTexts.length + ', font: ' + _mushafSize + 'pt')

      var textEndY = textY + 12

      // -- Footer: round nav buttons —
      var ftrCY = textEndY + 36  // center y of footer row
      var ftrR = 24  // circle radius
      var ftrGap = 64  // gap between circle centers
      var ftrCX = [233 - ftrGap, 233, 233 + ftrGap]  // ◀ ⌂ ▶ centers
      var ftrCH = ['«', '⌂', '»']
      var prevPg = _page > 1 ? _page - 1 : 604
      var nextPg = _page < 604 ? _page + 1 : 1
      var ftrActions = [
        function () { gotoPage(prevPg) },
        function () { gotoHome() },
        function () { gotoPage(nextPg) },
      ]

      fill(0, ftrCY - ftrR - 8, 466, ftrR * 2 + 20, C.bg)

      for (var fi = 0; fi < 3; fi++) {
        var fcx = ftrCX[fi]
        // Outer gold ring
        hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: fcx, center_y: ftrCY, radius: ftrR, color: C.gold })
        // Inner black circle
        hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: fcx, center_y: ftrCY, radius: ftrR - 3, color: C.bg })
        // Icon text
        var t = hmUI.createWidget(hmUI.widget.TEXT, {
          x: fcx - ftrR, y: ftrCY - ftrR, w: ftrR * 2, h: ftrR * 2,
          color: C.gold, text_size: 26,
          text: ftrCH[fi],
          align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
        })
        ;(function (cb) { t.addEventListener(hmUI.event.CLICK_DOWN, cb) })(ftrActions[fi])
      }

      stage('ok')
      _renderedOK = true
      saveLastRead()
    } catch (e) {
      label('ERR @' + _stage + ': ' + e, 60, 140, 346, 220, C.gold, F.label, true)
      chip(196, 380, 74, 56, '↩', C.textHi, function () { gotoHome() })
    }
  },

  onDestroy() {
    if (_renderedOK) saveLastRead()
  },
})
