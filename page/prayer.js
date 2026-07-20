// Prayer Times — Batch H (Jadwal Sholat)
// Spec: docs/prompts/04-BATCH-LANJUTAN.md (BATCH H), user prompt.
// Reuses proven patterns: page/index.js (label/fill/tapZone/safeWidth),
// page/tasbih.js (module-scope state + onDestroy cleanup).
//
// Timer: setInterval 60s for countdown, synced to minute boundary on load.
// CLEANUP: clearInterval in onDestroy — MANDATORY (AGENTS §3.6).
// ROLLOVER: the per-minute tick also checks a date-key; if midnight passed since
// build() (page left foreground across 00:00), it recomputes times + refreshes the
// header Masehi + Hijri dates and all 6 row values (5 prayers + Terbit). No new
// timer — reuses the existing one.
// ROWS: 6 rows — Subuh, Terbit, Dzuhur, Ashar, Maghrib, Isya. Terbit (sunrise) is
// informational only: styled dimmer (C.textLo) and never highlighted as "next prayer"
// (excluded from nextPrayer candidates). Terbit uses NO ihtiyat (only the 5 do).
// HIJRI: header shows the Hijri date below the Masehi date (page/hijri-calc.js,
// tabular algorithm + HIJRI_OFFSET tuned to Kemenag/NU).
//
// VERIFIED APIs:
//  - TEXT, FILL_RECT, ARC (from page/tasbih.js & page/index.js)
//  - setLayerScrolling (from all existing pages)
//  - setInterval/clearInterval (standard JS runtime, proven in this firmware)
import * as hmUI from '@zos/ui'
import { back, replace } from '@zos/router'
import { C, F, BUILD, safeWidth, centerX } from './theme'
import { calculate, METHODS, MADHAB, toMinutes, nextPrayer, prayerNameId } from './prayer-calc'
import { formatHijri } from './hijri-calc'
import { getLocation } from '../src/data/location'

// ═══════════════════════════════════════════
// Layout constants (466×466 round, CX=CY=233)
// ═══════════════════════════════════════════

var CX = 233
var HEADER_Y = 16     // city + location icon (one tappable line)
var DATE_Y = 52       // Masehi date
var HIJRI_Y = 78      // Hijri date
var DIV_Y = 104
var ROW_START_Y = 110 // first row
var ROW_H = 40        // 6 rows fit within the bezel
var ROW_GAP = 4
var COUNTDOWN_Y = 376
var COUNTDOWN_H = 54

var ROW_W = 300
var BAR_W = 4

// Render order: Terbit (sunrise) sits between Subuh and Dzuhur but is NOT an
// obligatory prayer — styled dimmer and excluded from nextPrayer() candidates.
var DISPLAY = ['subuh', 'terbit', 'dzuhur', 'ashar', 'maghrib', 'isya']

// ═══════════════════════════════════════════
// Module-scope state (so onDestroy can clean up)
// ═══════════════════════════════════════════

var _timeoutId = null
var _intervalId = null
var _times = null
var _loc = null
var _countdownW = null
var _dateW = null
var _hijriW = null

// Widget refs for the 5 rows (to update highlights + refresh on date rollover)
var _rowBgs = []    // FILL_RECT backgrounds
var _rowBars = []   // left accent bars
var _rowTimeW = []  // right-aligned time TEXT widgets (refreshed on midnight rollover)

// Date-key ("YYYY-MM-DD") captured at build(); mismatch on a tick ⇒ midnight passed.
var _dateKey = null

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

/** Stable per-day key ("YYYY-MM-DD") used to detect midnight rollover. */
function dateKey(d) {
  var m = d.getMonth() + 1
  var day = d.getDate()
  return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day)
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

/**
 * Recompute prayer times for a new day and refresh all date-dependent widgets:
 * header date label + the 5 row time values. Called by updateCountdown() when the
 * system date has changed since build() (page left foreground across midnight).
 * Cheap: one calculate() + six setProperty calls. No new timer created.
 */
function refreshForNewDay(now) {
  _times = calculate(now, _loc, METHODS.kemenag, MADHAB.shafii, 2)
  _dateKey = dateKey(now)
  try {
    _dateW.setProperty(hmUI.prop.MORE, { text: formatDate(now) })
  } catch (e) { /* ignore */ }
  try {
    _hijriW.setProperty(hmUI.prop.MORE, { text: formatHijri(now) })
  } catch (e) { /* ignore */ }
  for (var i = 0; i < DISPLAY.length; i++) {
    try {
      _rowTimeW[i].setProperty(hmUI.prop.MORE, { text: _times[DISPLAY[i]] })
    } catch (e) { /* ignore */ }
  }
  console.log('[prayer] date rollover — recomputed times for ' + _dateKey)
}

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
  var now = new Date()
  // Midnight rollover check (uses the EXISTING per-minute timer — no new timer):
  // if the system date changed since build(), recompute all date-dependent state
  // before updating the countdown, so 5 rows + header stay correct across 00:00.
  if (dateKey(now) !== _dateKey) {
    refreshForNewDay(now)
  }
  var nowMin = now.getHours() * 60 + now.getMinutes()
  var next = nextPrayer(_times, nowMin, _loc, METHODS.kemenag)
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
    _loc = getLocation() // active location (preset city or GPS); re-read fresh each build

    // ══ Background ══
    fill(0, 0, 466, 466, C.bg)

    // ══ Header: city + location icon (one tappable line) + dates ══
    // ROOT CAUSE of the b36 tap failure (fixed here): the tapZone was drawn BENEATH the
    // full-width city TEXT, so taps hit the text layer (no listener) and never reached
    // the tapZone. The PROVEN config — tasbih Reset/Preset, surah-list cards, settings
    // steppers — draws visuals FIRST and the tapZone LAST (topmost), so it receives taps
    // directly while staying transparent (alpha:1 overlay). That is what this does.
    // (widget.BUTTON exists in the API but is unused/unproven here; index.js itself uses
    //  this same FILL_RECT+addEventListener tapZone pattern — see its header comment.)
    // Icon = CIRCLE widget (proven, like the index.js brand mark). Pin/gear GLYPHS are
    // tofu-risk (AGENTS §3.14), so the icon is drawn with primitives, not a glyph.
    var cityStr = _loc.mode === 'auto' ? 'Lokasi GPS' : _loc.city
    var CHAR_W = 18                              // approx char width @ F.h2(34), Latin — overestimated so the icon never overlaps the text
    var cityTextW = cityStr.length * CHAR_W
    var ICON_R = 9
    var ICON_GAP = 10
    var groupW = cityTextW + ICON_GAP + ICON_R * 2
    var groupLeft = centerX(groupW)
    var iconCx = groupLeft + cityTextW + ICON_GAP + ICON_R
    var iconCy = HEADER_Y + 17

    labelLeft(cityStr, groupLeft, HEADER_Y, cityTextW, 34, C.gold, F.h2)
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: iconCx, center_y: iconCy, radius: ICON_R, color: C.gold })
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: iconCx, center_y: iconCy, radius: 3, color: C.bg })

    // Tap zone drawn LAST (topmost, transparent) — covers the city+icon group.
    // ≥48×48 (groupW is ≥ ~113 for the shortest city; widened to 200 for an easy tap).
    var locTapW = Math.max(groupW, 200)
    tapZone(centerX(locTapW), HEADER_Y, locTapW, 38, function () { replace({ url: 'page/location' }) })

    _dateW = label(formatDate(today), 0, DATE_Y, 466, 24, C.textMd, F.caption)

    _hijriW = label(formatHijri(today), 0, HIJRI_Y, 466, 24, C.textMd, F.caption)

    // Divider
    var divW = safeWidth(DIV_Y, 1, 466)
    fill(centerX(divW), DIV_Y, divW, 1, C.stroke)

    // ══ 6 prayer rows (5 wajib + Terbit) ══
    _times = calculate(today, _loc, METHODS.kemenag, MADHAB.shafii, 2)
    _dateKey = dateKey(today)

    var nowMin = getNowMinutes()
    var next = nextPrayer(_times, nowMin, _loc, METHODS.kemenag)

    for (var i = 0; i < DISPLAY.length; i++) {
      var key = DISPLAY[i]
      var rowY = ROW_START_Y + i * (ROW_H + ROW_GAP)
      var isNext = (key === next.name)
      var isInfo = (key === 'terbit')   // sunrise: informational, dimmer, never highlighted
      var nameColor = isInfo ? C.textLo : C.textHi

      var sw = safeWidth(rowY, ROW_H, ROW_W)
      var rowX = centerX(sw)

      // Row background (visible only when highlighted — Terbit never is)
      _rowBgs[i] = fill(rowX, rowY, sw, ROW_H, isNext ? C.emeraldSoft : C.bg)

      // Left accent bar
      _rowBars[i] = fill(rowX, rowY, BAR_W, ROW_H, isNext ? C.emeraldBright : C.bg)

      // Prayer name (left-aligned within the row, past the bar)
      var nameX = rowX + BAR_W + 8
      var nameW = Math.floor(sw * 0.45) - BAR_W - 8
      var timeW = Math.floor(sw * 0.45)

      labelLeft(prayerNameId(key), nameX, rowY, nameW, ROW_H, nameColor, F.bodyLg)

      // Prayer time (right-aligned)
      var timeX = rowX + sw - timeW - 4
      _rowTimeW[i] = labelRight(_times[key], timeX, rowY, timeW, ROW_H, nameColor, F.bodyLg)
    }

    // ══ Countdown ══
    var cdW = safeWidth(COUNTDOWN_Y, COUNTDOWN_H, 200)
    var remaining = minutesUntil(next.time, nowMin)
    _countdownW = label(formatCountdown(remaining), centerX(cdW), COUNTDOWN_Y, cdW, COUNTDOWN_H, C.gold, 34)

    // ══ Back affordance (top-left) ══
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
