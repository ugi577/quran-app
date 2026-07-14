// Surah List — manual paginated rows, rounded cards, safeWidth per row
// SCROLL_LIST tidak render di firmware ini → fallback widget per row.
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { push, back } from '@zos/router'
import { C, BUILD } from './theme'
import { getSurahIndex } from '../src/data/quran'
import { get as storeGet, set as storeSet } from '../src/data/store'

const CX = 233, R_SAFE = 213
function safeWidth(y, h, max) {
  const dy = Math.max(Math.abs(y - CX), Math.abs(y + h - CX))
  if (dy >= R_SAFE) return 0
  return Math.min(max || 400, Math.floor(2 * Math.sqrt(R_SAFE * R_SAFE - dy * dy)) - 16)
}
function centerX(w) { return Math.round(CX - w / 2) }

function label(text, x, y, w, h, color, size, wrap) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x, y, w, h, color,
    text_size: size,
    text,
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: wrap ? hmUI.text_style.WRAP : hmUI.text_style.NONE,
  })
}

function fill(x, y, w, h, color) {
  return hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color })
}

function cardBg(x, y, w, h, color, r) {
  return hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color, radius: r })
}

function tapZone(x, y, w, h, cb) {
  var zone = hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color: C.bg, alpha: 1 })
  zone.addEventListener(hmUI.event.CLICK_DOWN, cb)
  return zone
}

var ROWS_PER_PAGE = 4
var ROW_H = 72
var ROW_GAP = 8
var CARD_RADIUS = 20
var PAD_L = 16  // left padding inside card

Page({
  build() {
    hmUI.setLayerScrolling(false)
    fill(0, 0, 466, 466, C.bg)

    // Storage probe (silent)
    try {
      var lr = storeGet('lastRead')
      storeSet('lastRead', (lr && lr.surah) ? lr : { surah: 1, ayah: 1, page: 1, ts: 0 })
    } catch (e) { /* silent */ }

    var surahIndex = getSurahIndex()
    if (!surahIndex || surahIndex.length === 0) {
      label('No surah data', px(50), px(180), px(366), px(60), C.gold, 28)
      return
    }

    var TOTAL = surahIndex.length
    var TOTAL_PAGES = Math.ceil(TOTAL / ROWS_PER_PAGE)
    var currentPage = 0

    // Layout — all in native px (466×466 screen, px() ≈ identity)
    var HDR_Y = 8
    var HDR_H = 44
    var LIST_TOP = HDR_Y + HDR_H + 8  // = 60
    var FTR_BTN_H = 44
    var FTR_Y = 370  // footer top; bottom = 370+44=414, dy=414-233=181 ≤ 190

    // Header (persistent)
    fill(16, HDR_Y, 44, HDR_H, C.surface)
    label('←', 16, HDR_Y, 44, HDR_H, C.textHi, 34)
    tapZone(16, HDR_Y, 44, HDR_H, function () { back() })

    var titleW = safeWidth(HDR_Y + 6, HDR_H, 300)

    function renderPage(pg) {
      // Clear list area
      var listH = ROWS_PER_PAGE * (ROW_H + ROW_GAP)
      fill(0, LIST_TOP, 466, listH + 40, C.bg)

      // Clear title
      fill(centerX(titleW), HDR_Y + 6, titleW, HDR_H, C.bg)

      var startIdx = pg * ROWS_PER_PAGE
      var endIdx = Math.min(startIdx + ROWS_PER_PAGE, TOTAL)

      // Title
      label((startIdx + 1) + '–' + endIdx + ' / ' + TOTAL,
        centerX(titleW), HDR_Y + 6, titleW, HDR_H, C.gold, 34)

      // Rows — each card gets its own safeWidth based on y position
      for (var i = startIdx; i < endIdx; i++) {
        var s = surahIndex[i]
        var ri = i - startIdx
        var rowY = LIST_TOP + ri * (ROW_H + ROW_GAP)

        // Card width follows circle contour
        var cardW = safeWidth(rowY, ROW_H, 400)
        var cardX = centerX(cardW)

        // Card background (rounded)
        cardBg(cardX, rowY, cardW, ROW_H, C.surface, CARD_RADIUS)

        // Number (gold, left, padded)
        label(s.n.toString(), cardX + PAD_L, rowY, 38, ROW_H, C.gold, 28)

        // Latin name (white, right of number)
        var textRight = cardW - PAD_L - 48  // 48 reserved for ayah count
        label(s.nl, cardX + PAD_L + 46, rowY + 4, textRight - 54, 28, C.textHi, 24, false)

        // Arabic name (gold-dim, below Latin)
        label(s.na, cardX + PAD_L + 46, rowY + 34, textRight - 54, 26, C.goldDim, 22, false)

        // Ayah count (gray, right edge)
        label(s.ja.toString(), cardX + cardW - PAD_L - 40, rowY, 36, ROW_H, C.textLo, 22)

        // Tap zone
        ;(function (surahNum) {
          tapZone(cardX, rowY, cardW, ROW_H, function () {
            push({ url: 'page/reader', params: { surahNum: surahNum } })
          })
        })(s.n)
      }

      // -- Footer navigation (dy≤190 chord aman) --
      fill(0, FTR_Y - 8, 466, 90, C.bg)

      var ftrW = safeWidth(FTR_Y, FTR_BTN_H, 340)
      var ftrX = centerX(ftrW)
      var leftUsed = 0
      var rightUsed = 0

      if (pg > 0) {
        leftUsed = 72
        cardBg(ftrX, FTR_Y, 72, FTR_BTN_H, C.surface, 14)
        label('«', ftrX, FTR_Y, 72, FTR_BTN_H, C.gold, 24)
        tapZone(ftrX, FTR_Y, 72, FTR_BTN_H, function () {
          currentPage = pg - 1
          renderPage(currentPage)
        })
      }

      if (pg < TOTAL_PAGES - 1) {
        rightUsed = 72
        var nextX = ftrX + ftrW - 72
        cardBg(nextX, FTR_Y, 72, FTR_BTN_H, C.surface, 14)
        label('»', nextX, FTR_Y, 72, FTR_BTN_H, C.gold, 24)
        tapZone(nextX, FTR_Y, 72, FTR_BTN_H, function () {
          currentPage = pg + 1
          renderPage(currentPage)
        })
      }

      // Page indicator (fills remaining space between buttons)
      var indW = ftrW - leftUsed - rightUsed
      var indX = ftrX + leftUsed
      label((pg + 1) + '/' + TOTAL_PAGES, indX, FTR_Y, indW, FTR_BTN_H, C.textLo, 22)

      // Home button (below footer, centered)
      var homeY = FTR_Y + FTR_BTN_H + 8
      var homeW = 48, homeH = 36
      var homeX = centerX(homeW)
      fill(homeX, homeY, homeW, homeH, C.surface)
      label('⌂', homeX, homeY, homeW, homeH, C.textHi, 22)
      tapZone(homeX, homeY, homeW, homeH, function () { push({ url: 'page/index' }) })

      // Build marker
      label(BUILD, 0, 8, 72, 16, C.textLo, 16)
    }

    renderPage(0)
  },
})
