// Settings — font size, line spacing, word spacing
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { back } from '@zos/router'
import { C, BUILD } from './theme'
import { get as storeGet, set as storeSet } from '../src/data/store'

var CX = 233, R_SAFE = 213
function safeWidth(y, h, max) {
  var dy = Math.max(Math.abs(y - CX), Math.abs(y + h - CX))
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

// Font size mapping
var PCT_STEPS = [7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
var SIZE_MAP = [12, 13, 15, 16, 18, 21, 24, 27, 30, 33, 36, 39, 42]

function pctToSize(pct) {
  for (var i = 0; i < PCT_STEPS.length; i++) {
    if (PCT_STEPS[i] === pct) return SIZE_MAP[i]
  }
  return 21
}

function pctFromSize(size) {
  var best = 30
  var bestD = 999
  for (var i = 0; i < SIZE_MAP.length; i++) {
    var d = Math.abs(SIZE_MAP[i] - size)
    if (d < bestD) { bestD = d; best = PCT_STEPS[i] }
  }
  return best
}

// Spacing steps
var LINE_SPACING_STEPS = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130]
var WORD_SPACING_STEPS = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120]

// Generic stepper control row
function stepperRow(y, rowH, labelText, steps, currentVal, fmt, onChange) {
  var rowW = safeWidth(y, rowH, 380)
  var rowX = centerX(rowW)
  var btnW = 56
  var lblW = 100
  var valW = rowW - btnW * 2 - lblW

  // Background
  fill(rowX, y, rowW, rowH, C.surface)

  // Label (left)
  label(labelText, rowX, y, lblW, rowH, C.textLo, 20)

  // Minus button
  var minusX = rowX + lblW
  fill(minusX, y, btnW, rowH, C.surfacePress)
  label('−', minusX, y, btnW, rowH, C.textHi, 32)
  tapZone(minusX, y, btnW, rowH, function () {
    var idx = steps.indexOf(currentVal)
    if (idx > 0) { onChange(steps[idx - 1]) }
  })

  // Value display (center)
  var valX = minusX + btnW
  label(fmt(currentVal), valX, y, valW, rowH, C.gold, 26)

  // Plus button
  var plusX = valX + valW
  fill(plusX, y, btnW, rowH, C.surfacePress)
  label('+', plusX, y, btnW, rowH, C.textHi, 32)
  tapZone(plusX, y, btnW, rowH, function () {
    var idx = steps.indexOf(currentVal)
    if (idx < steps.length - 1) { onChange(steps[idx + 1]) }
  })
}

Page({
  build() {
    hmUI.setLayerScrolling(true)
    fill(0, 0, 466, 466, C.bg)

    var settings = storeGet('settings') || {}

    // Current values
    var fontSizePct = pctFromSize(settings.mushafSize || 21)
    var lineSpPct = settings.lineSpacing || 100
    var wordSpPct = settings.wordSpacing || 100

    // -- Header --
    var HDR_Y = px(8), HDR_H = px(44)
    fill(px(16), HDR_Y, px(44), HDR_H, C.surface)
    label('←', px(16), HDR_Y, px(44), HDR_H, C.textHi, 34)
    tapZone(px(16), HDR_Y, px(44), HDR_H, function () { back() })
    var titleW = safeWidth(HDR_Y + px(6), HDR_H, 280)
    label('Pengaturan', centerX(titleW), HDR_Y + px(6), titleW, HDR_H, C.gold, 30)

    var divY = HDR_Y + HDR_H + px(4)
    var divW = safeWidth(divY, px(2))
    fill(centerX(divW), divY, divW, px(2), C.stroke)

    // -- Row 1: Font Size --
    var ROW_H = px(56)
    var ROW_GAP = px(8)
    var y1 = divY + px(12)

    function drawFontRow(pct) {
      // Clear
      var rowW = safeWidth(y1, ROW_H, 380)
      fill(centerX(rowW) - 4, y1 - 4, rowW + 8, ROW_H + 8, C.bg)
      stepperRow(y1, ROW_H, 'Font', PCT_STEPS, pct,
        function (v) { return v + '%' },
        function (newPct) {
          var newSize = pctToSize(newPct)
          settings.mushafSize = newSize
          storeSet('settings', settings)
          fontSizePct = newPct
          drawFontRow(newPct)
          drawPreview()
        })
    }

    // -- Row 2: Line Spacing --
    var y2 = y1 + ROW_H + ROW_GAP
    function drawLineRow(pct) {
      var rowW = safeWidth(y2, ROW_H, 380)
      fill(centerX(rowW) - 4, y2 - 4, rowW + 8, ROW_H + 8, C.bg)
      stepperRow(y2, ROW_H, 'Spasi', LINE_SPACING_STEPS, pct,
        function (v) { return v + '%' },
        function (newPct) {
          settings.lineSpacing = newPct
          storeSet('settings', settings)
          lineSpPct = newPct
          drawLineRow(newPct)
        })
    }

    // -- Row 3: Word Spacing --
    var y3 = y2 + ROW_H + ROW_GAP
    function drawWordRow(pct) {
      var rowW = safeWidth(y3, ROW_H, 380)
      fill(centerX(rowW) - 4, y3 - 4, rowW + 8, ROW_H + 8, C.bg)
      stepperRow(y3, ROW_H, 'Kata', WORD_SPACING_STEPS, pct,
        function (v) { return v + '%' },
        function (newPct) {
          settings.wordSpacing = newPct
          storeSet('settings', settings)
          wordSpPct = newPct
          drawWordRow(newPct)
        })
    }

    // -- Preview --
    var prevY = y3 + ROW_H + px(20)
    function drawPreview() {
      var prevW = safeWidth(prevY, px(50), 380)
      var size = pctToSize(fontSizePct)
      fill(centerX(prevW) - 4, prevY - 4, prevW + 8, px(58), C.bg)
      label('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', centerX(prevW), prevY, prevW, px(50), C.gold, size)
    }

    // Initial draw
    drawFontRow(fontSizePct)
    drawLineRow(lineSpPct)
    drawWordRow(wordSpPct)
    drawPreview()

    // Build marker
    label(BUILD, 0, prevY + px(70), 466, 24, C.textLo, 20)
  },
})
