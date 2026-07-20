// Location — Batch H (ganti lokasi sholat). Reused as-is by Batch N (Settings) & linked from Qibla.
//
// Two modes:
//   • Otomatis (GPS) — @zos/sensor Geolocation: start → onChange → getStatus()==='A' →
//     getLatitude/getLongitude → setLocationAuto. 20s timeout → "GPS tidak tersedia".
//     NEVER leaves the page hanging: every path sets a status string. Geolocation is
//     stopped + offChange + clearTimeout in onDestroy (AGENTS §3.6 — GPS eats battery).
//   • Manual — paginated preset-city list (surah-list pattern; SCROLL_LIST does not
//     render on this firmware). Tap city → setLocationManual → replace('/page/prayer')
//     so prayer.build() re-runs FRESH with the new location (Zepp Page has no onShow;
//     replace is the proven way to force a re-build on return).
//
// Navigation: this page is entered via router.replace from prayer, so the ← back button
// also replace→prayer (NOT back(), which would pop to home). Keeps the stack depth stable.
//
// VERIFIED APIs (device-types/dist/index.d.ts):
//  - Geolocation (@version 2.1): new Geolocation(); start/stop; getStatus()→'A'|'V';
//    getLatitude()/getLongitude() → number (DD default, WGS-84); onChange(cb)/offChange(cb).
//    (getEnabled/onEnableChange are @version 4.0 — unavailable on apiVersion 3.0; the
//     20s timeout handles denial/unavailability instead.)
//  - router.replace({url}) — forces fresh build() of the target page.
import * as hmUI from '@zos/ui'
import { replace } from '@zos/router'
import { Geolocation } from '@zos/sensor'
import { C, BUILD } from './theme'
import {
  PRESET_CITIES, getLocation, setLocationManual, setLocationAuto,
} from '../src/data/location'

const CX = 233, R_SAFE = 213
function safeWidth(y, h, max) {
  const dy = Math.max(Math.abs(y - CX), Math.abs(y + h - CX))
  if (dy >= R_SAFE) return 0
  return Math.min(max || 400, Math.floor(2 * Math.sqrt(R_SAFE * R_SAFE - dy * dy)) - 16)
}
function centerX(w) { return Math.round(CX - w / 2) }

function label(text, x, y, w, h, color, size) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x, y, w, h, color, text_size: size, text,
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
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

// ── Layout ──
var HDR_Y = 8, HDR_H = 44
var GPS_Y = 62, GPS_H = 46
var STATUS_Y = 114, STATUS_H = 22
var DIV_Y = 140
var LIST_LABEL_Y = 146, LIST_LABEL_H = 20
var LIST_TOP = 172
var ROW_H = 44, ROW_GAP = 6
var ROWS_PER_PAGE = 4
var FTR_Y = 374, FTR_H = 44

// ── Module-scope state (onDestroy must clean up GPS + timer) ──
var _statusW = null       // status TEXT widget (current location / GPS feedback)
var _geo = null           // Geolocation instance while searching
var _geoCb = null         // onChange callback ref (needed for offChange)
var _gpsTimeout = null    // 20s timeout id
var _gpsDone = false      // guard: resolved (fix or timeout) flag
var _currentPage = 0

function fmtCoord(lat, lon) {
  function f(v) { return (Math.round(v * 100) / 100).toFixed(2) }
  return f(lat) + ', ' + f(lon)
}

function setStatus(text, color) {
  if (!_statusW) return
  try {
    _statusW.setProperty(hmUI.prop.MORE, { text: text, color: color })
  } catch (e) { console.log('[location] setStatus err: ' + e) }
}

function cleanupGeo() {
  if (_gpsTimeout) {
    try { clearTimeout(_gpsTimeout) } catch (e) { console.log('[location] clearTimeout err: ' + e) }
    _gpsTimeout = null
  }
  if (_geo && _geoCb) {
    try { _geo.offChange(_geoCb) } catch (e) { console.log('[location] offChange err: ' + e) }
  }
  if (_geo) {
    try { _geo.stop() } catch (e) { console.log('[location] geo.stop err: ' + e) }
  }
  _geo = null
  _geoCb = null
}

// ── GPS flow ──
function startGps() {
  if (_geo) return // already searching
  _gpsDone = false
  setStatus('Mencari lokasi...', C.gold)
  try {
    _geo = new Geolocation()
  } catch (e) {
    console.log('[location] Geolocation unavailable: ' + e)
    setStatus('GPS tidak tersedia — gunakan Manual', C.textLo)
    return
  }
  _geoCb = function () {
    if (_gpsDone || !_geo) return
    if (_geo.getStatus() === 'A') {
      _gpsDone = true
      var lat = _geo.getLatitude()
      var lon = _geo.getLongitude()
      setLocationAuto(lat, lon)
      setStatus('GPS: ' + fmtCoord(lat, lon) + ' — kembali', C.emeraldBright)
      cleanupGeo()
    }
  }
  try {
    _geo.onChange(_geoCb)
    _geo.start()
  } catch (e) {
    console.log('[location] geo start err: ' + e)
    setStatus('GPS tidak tersedia — gunakan Manual', C.textLo)
    cleanupGeo()
    return
  }
  _gpsTimeout = setTimeout(function () {
    if (_gpsDone) return
    _gpsDone = true
    setStatus('GPS tidak tersedia — gunakan Manual', C.textLo)
    cleanupGeo()
  }, 20000)
}

function gotoPrayer() {
  cleanupGeo()
  replace({ url: 'page/prayer' }) // fresh build() re-reads getLocation()
}

// ── City list (paginated, surah-list pattern) ──
function renderPage(pg) {
  var listH = ROWS_PER_PAGE * (ROW_H + ROW_GAP)
  fill(0, LIST_TOP, 466, listH + 40, C.bg) // clear list area

  var loc = getLocation()
  var activeId = loc.cityId
  var TOTAL = PRESET_CITIES.length
  var TOTAL_PAGES = Math.ceil(TOTAL / ROWS_PER_PAGE)
  var startIdx = pg * ROWS_PER_PAGE
  var endIdx = Math.min(startIdx + ROWS_PER_PAGE, TOTAL)

  for (var i = startIdx; i < endIdx; i++) {
    var city = PRESET_CITIES[i]
    var ri = i - startIdx
    var rowY = LIST_TOP + ri * (ROW_H + ROW_GAP)
    var isActive = (city.id === activeId && loc.mode === 'manual')

    var cardW = safeWidth(rowY, ROW_H, 340)
    var cardX = centerX(cardW)

    cardBg(cardX, rowY, cardW, ROW_H, isActive ? C.emeraldSoft : C.surface, 14)
    if (isActive) {
      fill(cardX, rowY, 4, ROW_H, C.emeraldBright) // left accent bar (selected)
    }
    label(city.name, cardX + 12, rowY, cardW - 24, ROW_H,
      isActive ? C.goldBright : C.textHi, 26)

    // Tap → save + return to prayer (fresh build)
    ;(function (cityId) {
      tapZone(cardX, rowY, cardW, ROW_H, function () {
        setLocationManual(cityId)
        gotoPrayer()
      })
    })(city.id)
  }

  // Footer « » pagination
  fill(0, FTR_Y - 6, 466, FTR_H + 12, C.bg)
  var ftrW = safeWidth(FTR_Y, FTR_H, 340)
  var ftrX = centerX(ftrW)
  var leftUsed = 0, rightUsed = 0

  if (pg > 0) {
    leftUsed = 72
    cardBg(ftrX, FTR_Y, 72, FTR_H, C.surface, 14)
    label('«', ftrX, FTR_Y, 72, FTR_H, C.gold, 24)
    tapZone(ftrX, FTR_Y, 72, FTR_H, function () { _currentPage = pg - 1; renderPage(_currentPage) })
  }
  if (pg < TOTAL_PAGES - 1) {
    rightUsed = 72
    var nextX = ftrX + ftrW - 72
    cardBg(nextX, FTR_Y, 72, FTR_H, C.surface, 14)
    label('»', nextX, FTR_Y, 72, FTR_H, C.gold, 24)
    tapZone(nextX, FTR_Y, 72, FTR_H, function () { _currentPage = pg + 1; renderPage(_currentPage) })
  }
  var indW = ftrW - leftUsed - rightUsed
  label((pg + 1) + '/' + TOTAL_PAGES, ftrX + leftUsed, FTR_Y, indW, FTR_H, C.textLo, 22)
}

Page({
  build() {
    hmUI.setLayerScrolling(false)
    fill(0, 0, 466, 466, C.bg)

    // ── Header ──
    fill(16, HDR_Y, 44, HDR_H, C.surface)
    label('←', 16, HDR_Y, 44, HDR_H, C.textHi, 34)
    tapZone(16, HDR_Y, 44, HDR_H, function () { gotoPrayer() })
    var titleW = safeWidth(HDR_Y + 6, HDR_H, 280)
    label('Lokasi Sholat', centerX(titleW), HDR_Y + 6, titleW, HDR_H, C.gold, 30)

    // ── GPS action button ──
    var gpsW = safeWidth(GPS_Y, GPS_H, 260)
    var gpsX = centerX(gpsW)
    cardBg(gpsX, GPS_Y, gpsW, GPS_H, C.emerald, 16)
    label('Otomatis (GPS)', gpsX, GPS_Y, gpsW, GPS_H, C.textHi, 24)
    tapZone(gpsX, GPS_Y, gpsW, GPS_H, function () { startGps() })

    // ── Status (current location / GPS feedback) ──
    var loc = getLocation()
    var initText = loc.mode === 'auto'
      ? 'Aktif: Lokasi GPS ' + fmtCoord(loc.lat, loc.lon)
      : 'Aktif: ' + loc.city
    _statusW = label(initText, 0, STATUS_Y, 466, STATUS_H, C.gold, 20)

    // Divider
    var divW = safeWidth(DIV_Y, 1, 466)
    fill(centerX(divW), DIV_Y, divW, 1, C.stroke)

    label('Pilih Kota', 0, LIST_LABEL_Y, 466, LIST_LABEL_H, C.textMd, 20)

    // City list
    renderPage(_currentPage)

    // Build marker
    label(BUILD, 0, 422, 466, 16, C.textLo, 14)
  },

  onDestroy() {
    // MANDATORY: stop GPS + clear timeout (AGENTS §3.6 — GPS eats battery)
    cleanupGeo()
    console.log('[location] onDestroy — gps + timer cleared')
  },
})
