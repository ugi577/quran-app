// Settings — ukuran font mushaf (percentage 10-100%)
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { back } from '@zos/router'
import { C, BUILD } from './theme'
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

function tapZone(x, y, w, h, cb) {
  var zone = hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color: C.bg, alpha: 1 })
  zone.addEventListener(hmUI.event.CLICK_DOWN, cb)
  return zone
}

// Map percentage to actual font size
// 10%→16pt ... 100%→42pt  (default 60%→30pt, previous default was 32pt)
var PCT_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
var SIZE_MAP = [16, 18, 21, 24, 27, 30, 33, 36, 39, 42]

function pctToSize(pct) {
  for (var i = 0; i < PCT_STEPS.length; i++) {
    if (PCT_STEPS[i] === pct) return SIZE_MAP[i]
  }
  return 30 // fallback
}

Page({
  build() {
    hmUI.setLayerScrolling(false)
    fill(0, 0, 466, 466, C.bg)

    // Load settings
    var settings = storeGet('settings') || {}
    var currentPct = 60
    // Determine current percentage from stored size
    var storedSize = settings.mushafSize || 32
    // Find closest percentage
    var bestDist = 999
    for (var i = 0; i < SIZE_MAP.length; i++) {
      var dist = Math.abs(SIZE_MAP[i] - storedSize)
      if (dist < bestDist) { bestDist = dist; currentPct = PCT_STEPS[i] }
    }

    var currentSize = pctToSize(currentPct)

    // -- Header --
    var HDR_Y = px(12), HDR_H = px(48)
    fill(px(16), HDR_Y, px(44), HDR_H, C.surface)
    label('←', px(16), HDR_Y, px(44), HDR_H, C.textHi, 34)
    tapZone(px(16), HDR_Y, px(44), HDR_H, function () { back() })

    var titleW = safeWidth(HDR_Y + px(6), HDR_H, 300)
    label('Ukuran Font', centerX(titleW), HDR_Y + px(6), titleW, HDR_H, C.gold, 34)

    var divY = HDR_Y + HDR_H + px(4)
    var divW = safeWidth(divY, px(2))
    fill(centerX(divW), divY, divW, px(2), C.stroke)

    // -- Main controls --
    var PCT_Y = divY + px(40)
    var PCT_H = px(72)
    var BTN_W = px(88)
    var BTN_H = px(72)

    // Minus button
    var minusX = px(90)
    function drawMinus() {
      fill(minusX, PCT_Y, BTN_W, BTN_H, C.surface)
      label('−', minusX, PCT_Y, BTN_W, BTN_H, C.textHi, 52)
    }

    // Plus button
    var plusX = px(288)
    function drawPlus() {
      fill(plusX, PCT_Y, BTN_W, BTN_H, C.surface)
      label('+', plusX, PCT_Y, BTN_W, BTN_H, C.textHi, 52)
    }

    // Percentage display
    var pctLabelX = px(178), pctLabelW = px(110)
    function drawPct(pct) {
      fill(pctLabelX, PCT_Y, pctLabelW, BTN_H, C.bg)
      label(pct + '%', pctLabelX, PCT_Y, pctLabelW, BTN_H, C.gold, 48)
    }

    // Preview
    var prevY = PCT_Y + BTN_H + px(28)
    var prevW = safeWidth(prevY, px(60), 380)
    function drawPreview(size) {
      fill(centerX(prevW), prevY, prevW, px(60), C.bg)
      label('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', centerX(prevW), prevY, prevW, px(60), C.gold, size)
    }

    // Initial draw
    drawMinus()
    drawPlus()
    drawPct(currentPct)
    drawPreview(currentSize)

    // -- Tap handlers (re-create tap zones after each change) --
    function bindTaps(pct) {
      tapZone(minusX, PCT_Y, BTN_W, BTN_H, function () {
        var idx = PCT_STEPS.indexOf(pct)
        if (idx > 0) {
          var newPct = PCT_STEPS[idx - 1]
          var newSize = pctToSize(newPct)
          settings.mushafSize = newSize
          storeSet('settings', settings)
          drawPct(newPct)
          drawPreview(newSize)
          bindTaps(newPct)
        }
      })

      tapZone(plusX, PCT_Y, BTN_W, BTN_H, function () {
        var idx = PCT_STEPS.indexOf(pct)
        if (idx < PCT_STEPS.length - 1) {
          var newPct = PCT_STEPS[idx + 1]
          var newSize = pctToSize(newPct)
          settings.mushafSize = newSize
          storeSet('settings', settings)
          drawPct(newPct)
          drawPreview(newSize)
          bindTaps(newPct)
        }
      })
    }

    bindTaps(currentPct)

    // Help text
    var helpY = prevY + px(68)
    label('10% = 16pt  •  100% = 42pt', centerX(safeWidth(helpY, px(24), 360)), helpY, safeWidth(helpY, px(24), 360), px(24), C.textLo, 20)

    // Build marker
    label(BUILD, 0, px(440), 466, 24, C.textLo, 20)
  },
})
