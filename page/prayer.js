// Prayer Times — Batch H (Jadwal Sholat)
// Spec: docs/prompts/04-BATCH-LANJUTAN.md (BATCH H), user prompt.
// Reuses proven patterns: page/index.js (label/fill/tapZone/safeWidth),
// page/tasbih.js (module-scope state + onDestroy cleanup).
//
// Timer: setInterval 60s for countdown, synced to minute boundary on load.
// CLEANUP: clearInterval in onDestroy — MANDATORY (AGENTS §3.6).
//
// VERIFIED APIs:
//  - TEXT, FILL_RECT, ARC (from page/tasbih.js & page/index.js)
//  - setLayerScrolling (from all existing pages)
//  - setInterval/clearInterval (standard JS runtime, proven in this firmware)
import * as hmUI from '@zos/ui'
import { back } from '@zos/router'
import { C, F, BUILD, safeWidth, centerX } from './theme'
import { calculate, LOCATION, METHODS, MADHAB, toMinutes, nextPrayer, prayerNameId } from './prayer-calc'

// ═══════════════════════════════════════════
// Layout constants (466×466 round, CX=CY=233)
// ═══════════════════════════════════════════

var CX = 233
var HEADER_Y = 20
var DATE_Y = 58
var DIV_Y = 84
var ROW_START_Y = 98
var ROW_H = 48
var ROW_GAP = 6
var COUNTDOWN_Y = 374
var COUNTDOWN_H = 60

var ROW_W = 300
var BAR_W = 4

// Prayer row order (display-only, excluding Terbit/Syuruq per common practice)
var DISPLAY = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']

// ═══════════════════════════════════════════
// Module-scope state (so onDestroy can clean up)
// ═══════════════════════════════════════════

var _timeoutId = null
var _intervalId = null
var _times = null
var _countdownW = null
var _dateW = null

// Widget refs for the 5 rows (to update highlights)
var _rowBgs = []   // FILL_RECT backgrounds
var _rowBars = []  // left accent bars

// ═══════════════════════════════════════════
// Inline UI helpers (mirrors page/tasbih.js)
// ═══════════════════════════════════════════

function label(text, x, y, w, h, color, size) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x: x, y: y, w: w, h: h, color: color,
    text_size: size, text: text,
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
  })
}

function labelLeft(text, x, y, w, h, color, size) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x: x, y: y, w: w, h: h, color: color,
    text_size: size, text: text,
    align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
  })
}

function labelRight(text, x, y, w, h, color, size) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x: x, y: y, w: w, h: h, color: color,
    text_size: size, text: text,
    align_h: hmUI.align.RIGHT, align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
  })
}

function fill(x, y, w, h, color) {
  return hmUI.createWidget(hmUI.widget.FILL_RECT, { x: x, y: y, w: w, h: h, color: color })
}

function tapZone(x, y, w, h, cb) {
  var zone = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: x, y: y, w: w, h: h, color: C.bg, alpha: 1 })
  zone.addEventListener(hmUI.event.CLICK_DOWN, cb)
  return zone
}

// ═══════════════════════════════════════════
// Date formatting (Indonesian locale)
// ═══════════════════════════════════════════

var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
function formatDate(d) {
  return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear()
}

// ═══════════════════════════════════════════
// Countdown formatting
// ═══════════════════════════════════════════

/**
 * Format minutes remaining as "− HH:MM" or "− MM".
 * If minutes >= 24h, adds a day but that won't happen in practice.
 */
function formatCountdown(minutes) {
  if (minutes < 0) minutes = 0
  var h = Math.floor(minutes / 60)
  var m = minutes % 60
  if (h > 99) h = 99
  var hs = h < 10 ? '0' + h : String(h)
  var ms = m < 10 ? '0' + m : String(m)
  return '− ' + hs + ':' + ms  // minus sign (U+2212, proven glyph on this watch)
}

// ═══════════════════════════════════════════
// Time helpers
// ═══════════════════════════════════════════

function getNowMinutes() {
  var d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

/**
 * Compute minutes remaining until target time (HH:MM).
 * If target is tomorrow (targetMin < nowMin), adds 24h.
 */
function minutesUntil(targetHhmm, nowMin) {
  var targetMin = toMinutes(targetHhmm)
  var diff = targetMin - nowMin
  if (diff < 0) diff += 24 * 60
  return diff
}

// ═══════════════════════════════════════════
// UI update helpers
// ═══════════════════════════════════════════

function updateHighlights(nextKey) {
  for (var i = 0; i < DISPLAY.length; i++) {
    var isNext = (DISPLAY[i] === nextKey)
    try {
      _rowBgs[i].setProperty(hmUI.prop.MORE, { color: isNext ? C.emeraldSoft : C.bg })
    } catch (e) { /* ignore */ }
    try {
      _rowBars[i].setProperty(hmUI.prop.MORE, { color: isNext ? C.emeraldBright : C.bg })
    } catch (e) { /* ignore */ }
  }
}

function updateCountdown() {
  var nowMin = getNowMinutes()
  var next = nextPrayer(_times, nowMin, LOCATION, METHODS.kemenag)
  var remaining = minutesUntil(next.time, nowMin)
  try {
    _countdownW.setProperty(hmUI.prop.MORE, { text: formatCountdown(remaining) })
  } catch (e) { /* ignore */ }
  updateHighlights(next.name)
}

// ═══════════════════════════════════════════
// Timer management
// ═══════════════════════════════════════════

function startTimer() {
  updateCountdown() // immediate first update

  // Sync to next minute boundary for clean minute-aligned updates
  var secs = new Date().getSeconds()
  var toNextMin = (60 - secs) * 1000

  _timeoutId = setTimeout(function () {
    _timeoutId = null
    updateCountdown()
    // Then every 60 seconds
    _intervalId = setInterval(function () {
      updateCountdown()
    }, 60000)
  }, toNextMin)
}

Page({
  build() {
    hmUI.setLayerScrolling(false)

    var today = new Date()

    // ══ Background ══
    fill(0, 0, 466, 466, C.bg)

    // ══ Header: city name + date ══
    label(LOCATION.city, 0, HEADER_Y, 466, 34, C.gold, F.h2)

    _dateW = label(formatDate(today), 0, DATE_Y, 466, 24, C.textMd, F.caption)

    // Divider
    var divW = safeWidth(DIV_Y, 1, 466)
    fill(centerX(divW), DIV_Y, divW, 1, C.stroke)

    // ══ 5 prayer rows ══
    _times = calculate(today, LOCATION, METHODS.kemenag, MADHAB.shafii, 2)

    var nowMin = getNowMinutes()
    var next = nextPrayer(_times, nowMin, LOCATION, METHODS.kemenag)

    for (var i = 0; i < DISPLAY.length; i++) {
      var key = DISPLAY[i]
      var rowY = ROW_START_Y + i * (ROW_H + ROW_GAP)
      var isNext = (key === next.name)

      var sw = safeWidth(rowY, ROW_H, ROW_W)
      var rowX = centerX(sw)

      // Row background (visible only when highlighted)
      _rowBgs[i] = fill(rowX, rowY, sw, ROW_H, isNext ? C.emeraldSoft : C.bg)

      // Left accent bar
      _rowBars[i] = fill(rowX, rowY, BAR_W, ROW_H, isNext ? C.emeraldBright : C.bg)

      // Prayer name (left-aligned within the row, past the bar)
      var nameX = rowX + BAR_W + 8
      var nameW = Math.floor(sw * 0.45) - BAR_W - 8
      var timeW = Math.floor(sw * 0.45)

      labelLeft(prayerNameId(key), nameX, rowY, nameW, ROW_H, C.textHi, F.bodyLg)

      // Prayer time (right-aligned)
      var timeX = rowX + sw - timeW - 4
      labelRight(_times[key], timeX, rowY, timeW, ROW_H, C.textHi, F.bodyLg)
    }

    // ══ Countdown ══
    var cdW = safeWidth(COUNTDOWN_Y, COUNTDOWN_H, 200)
    var remaining = minutesUntil(next.time, nowMin)
    _countdownW = label(formatCountdown(remaining), centerX(cdW), COUNTDOWN_Y, cdW, COUNTDOWN_H, C.gold, 34)

    // ══ Back affordance ══
    tapZone(16, 10, 44, 44, function () { back() })
    label('←', 16, 10, 44, 44, C.textHi, 34)  // ← (U+2190, proven)

    // ══ Build marker ══
    label(BUILD, 0, 436, 466, 22, C.textLo, 18)

    // ══ Start per-minute timer ══
    startTimer()
  },

  onDestroy() {
    // MANDATORY: clear all timers (AGENTS §3.6)
    if (_timeoutId) {
      try { clearTimeout(_timeoutId) } catch (e) { console.log('[prayer] clearTimeout err: ' + e) }
      _timeoutId = null
    }
    if (_intervalId) {
      try { clearInterval(_intervalId) } catch (e) { console.log('[prayer] clearInterval err: ' + e) }
      _intervalId = null
    }
    console.log('[prayer] onDestroy — timer cleared')
  },
})
