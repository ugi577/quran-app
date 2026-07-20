// Qibla compass — Quran Premium Batch J
// ARC-based compass face with dynamic qibla direction marker.
// Pattern: Compass sensor → onChange → update marker ARC (proven dynamic ARC from tasbih).
// tapZone TOPMOST (proven draw order from Batch H b37 fix).
//
// Calibration UX: hide marker + show "Gerakkan jam membentuk angka 8" when uncalibrated.
// Graceful degrade: static bearing display if compass HW is unavailable after timeout.
//
// ⚠ PERMISSION: Compass needs device:os.compass (added in app.json). Zepp OS 3.0+.
//    On devices without a physical compass, getStatus() returns false and
//    getDirectionAngle() returns 'INVALID'. We handle this via the 20s timeout → degraded.

import * as hmUI from '@zos/ui'
import { back } from '@zos/router'
import { Compass } from '@zos/sensor'
import { C, F, BUILD, safeWidth, centerX } from './theme'
import { getLocation, locationLabel } from '../src/data/location'
import { bearingToKaaba, directionLabel } from './qibla-calc'

// ── helpers (pola index.js + prayer.js + tasbih.js) ──

function label(text, x, y, w, h, color, size) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x, y, w, h, color,
    text_size: size,
    text,
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
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

// ── kompas ring constants ──

var CX = 233, CY = 233
var RING_R = 130       // main ring radius (compact — leaves room below for status+button)
var TICK_W = 4         // cardinal tick width in degrees
var MARKER_W = 10       // qibla marker half-width in degrees
var TOPREF_W = 3       // top reference half-width

/** Screen-angle (0=top, clockwise) → ARC angle (0=3-o'clock, clockwise). */
function toArc(screenAngle) { return screenAngle - 90 }

Page({
  build() {
    hmUI.setLayerScrolling(false)
    fill(0, 0, 466, 466, C.bg)

    // ── location + bearing ──
    var loc = getLocation()
    var qiblaDeg = Math.round(bearingToKaaba(loc.lat, loc.lon))
    var qiblaDir = directionLabel(qiblaDeg)
    var locLbl = locationLabel(loc)

    // ── header ──
    label('Arah Kiblat', 0, 18, 466, 26, C.textMd, F.caption)
    label(qiblaDeg + '° ' + qiblaDir, 0, 46, 466, 48, C.gold, F.h1)
    label(locLbl, 0, 90, 466, 22, C.textLo, F.caption)

    // ── compass ring (static) ──
    hmUI.createWidget(hmUI.widget.ARC, {
      center_x: CX, center_y: CY, radius: RING_R,
      start_angle: 0, end_angle: 360,
      line_width: 2, color: C.stroke,
    })

    // Cardinal thick marks + labels — N/E/S/W (ARC convention angles)
    var cardinals = [
      { label: 'N', arcCenter: 270 },  // top (12 o'clock)
      { label: 'E', arcCenter: 0 },    // right (3 o'clock)
      { label: 'S', arcCenter: 90 },   // bottom (6 o'clock)
      { label: 'W', arcCenter: 180 },  // left (9 o'clock)
    ]
    for (var i = 0; i < cardinals.length; i++) {
      var c = cardinals[i]
      // Thick mark segment on the ring
      hmUI.createWidget(hmUI.widget.ARC, {
        center_x: CX, center_y: CY, radius: RING_R,
        start_angle: c.arcCenter - TICK_W,
        end_angle: c.arcCenter + TICK_W,
        line_width: 5, color: C.textMd,
      })
      // Label outside the ring
      var angleRad = (c.arcCenter + 90) * Math.PI / 180  // ARC→screen angle
      var lblR = RING_R + 22
      var tx = Math.round(CX + lblR * Math.sin(angleRad))
      var ty = Math.round(CY - lblR * Math.cos(angleRad))
      label(c.label, tx - 16, ty - 12, 32, 24, C.textMd, F.label)
    }

    // Top reference pointer — static gold mark at 12 o'clock
    hmUI.createWidget(hmUI.widget.ARC, {
      center_x: CX, center_y: CY, radius: RING_R - 6,
      start_angle: -90 - TOPREF_W,
      end_angle: -90 + TOPREF_W,
      line_width: 7, color: C.goldBright,
    })

    // ── qibla direction marker ARC (DYNAMIC) ──
    var _marker = hmUI.createWidget(hmUI.widget.ARC, {
      center_x: CX, center_y: CY, radius: RING_R - 6,
      start_angle: 0, end_angle: 0, // hidden until first valid heading
      line_width: 12, color: C.emeraldBright,
    })

    // Center dot
    hmUI.createWidget(hmUI.widget.CIRCLE, {
      center_x: CX, center_y: CY,
      radius: 6, color: C.gold,
    })

    // Inner accent circle (gold ring, thin)
    hmUI.createWidget(hmUI.widget.CIRCLE, {
      center_x: CX, center_y: CY,
      radius: 70, color: C.goldDim,
    })

    // ── calibration / status area ──
    var _statusW = label('', 0, 366, 466, 28, C.textLo, F.caption)

    // ── back button (safe bezel — lebar ≈125px di y=396) ──
    var btnY = 396, btnH = 38
    var btnW = safeWidth(btnY, btnH)
    var btnX = centerX(btnW)
    label('« Kembali', btnX, btnY, btnW, btnH, C.goldDim, F.label)
    // tapZone TOPMOST (draw AFTER visual — proven pattern, Batch H b37)
    tapZone(btnX, btnY, btnW, btnH, function () {
      back()
    })

    // ── BUILD marker ──
    label(BUILD, 0, 440, 466, 16, C.textLo, 14)

    // ── COMPASS SENSOR ──
    var _compass = null
    var _hasCompass = false
    var _calibrated = false
    var _degraded = false
    var _timeoutId = null
    var _visible = false

    function showDegraded() {
      if (_degraded) return
      _degraded = true
      _calibrated = false
      _visible = false
      _marker.setProperty(hmUI.prop.MORE, { start_angle: 0, end_angle: 0 })
      _statusW.setProperty(hmUI.prop.MORE, {
        text: qiblaDeg + '° ' + qiblaDir + ' — Arahkan jam ke utara, lalu putar ke arah penanda',
      })
      console.log('[qibla] degraded — compass unavailable')
    }

    function updateMarker() {
      if (!_hasCompass || _degraded) return

      var status = false
      var angle = 'INVALID'
      try {
        status = _compass.getStatus()
        angle = _compass.getDirectionAngle()
      } catch (e) {
        console.log('[qibla] compass read error: ' + e)
        showDegraded()
        return
      }

      if (!status || angle === 'INVALID') {
        if (_visible) {
          _marker.setProperty(hmUI.prop.MORE, { start_angle: 0, end_angle: 0 })
          _visible = false
        }
        _calibrated = false
        _statusW.setProperty(hmUI.prop.MORE, { text: 'Gerakkan jam membentuk angka 8' })
        return
      }

      // CALIBRATED
      if (!_calibrated) {
        _calibrated = true
        _statusW.setProperty(hmUI.prop.MORE, { text: '' })
        if (_timeoutId) { clearTimeout(_timeoutId); _timeoutId = null }
        console.log('[qibla] compass calibrated')
      }

      var heading = Number(angle)
      if (isNaN(heading)) { showDegraded(); return }

      var screenAngle = (qiblaDeg - heading + 360) % 360
      var arcAngle = toArc(screenAngle)
      var hw = MARKER_W
      _marker.setProperty(hmUI.prop.MORE, {
        start_angle: arcAngle - hw,
        end_angle: arcAngle + hw,
      })
      _visible = true
    }

    // Init Compass sensor (static import — zeus bundles it; try-catch on construction
    // handles devices without physical compass where new Compass() might throw)
    try {
      var c = new Compass()
      if (c && typeof c.start === 'function') {
        _compass = c
        _hasCompass = true
        console.log('[qibla] Compass init OK')
      }
    } catch (e) {
      console.log('[qibla] Compass construction failed: ' + e)
    }

    if (_hasCompass && _compass) {
      var _cb = function () { updateMarker() }
      try {
        _compass.onChange(_cb)
        _compass.start()
        console.log('[qibla] Compass started')
        // Initial check — if compass is already calibrated, show marker immediately.
        // If uncalibrated, show the calibration prompt (onChange may not fire until heading changes).
        updateMarker()

        // Timeout: if still uncalibrated after 20s, go degraded
        _timeoutId = setTimeout(function () {
          if (!_calibrated && !_degraded) {
            console.log('[qibla] 20s timeout — no calibration, show degraded')
            showDegraded()
          }
        }, 20000)

        this._compassCleanup = function () {
          if (_timeoutId) { clearTimeout(_timeoutId); _timeoutId = null }
          try { _compass.offChange(_cb) } catch (e) {}
          try { _compass.stop() } catch (e) {}
          console.log('[qibla] onDestroy — compass stopped')
        }
      } catch (e) {
        console.log('[qibla] Compass start failed: ' + e)
        showDegraded()
      }
    } else {
      showDegraded()
    }
  },

  onDestroy() {
    if (this._compassCleanup) {
      this._compassCleanup()
      this._compassCleanup = null
    }
  },
})
