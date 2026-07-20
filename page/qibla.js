// Qibla compass — Quran Premium Batch J (b39: real-compass rewrite)
//
// FIX HISTORY (b39 — root cause of "statis, tdk sebaik compas asli jam"):
//  1. ARC widgets now use the REQUIRED x/y/w/h bounding box. The b38 code passed
//     center_x/center_y (valid for CIRCLE, IGNORED by ARC) with no x/y/w/h, so every
//     arc — ring, ticks, top reference AND the dynamic qibla needle — rendered into a
//     0×0 box and was invisible. Verified vs docs.zepp.com + page/tasbih.js:
//     ARC = {x,y,w,h,radius,start_angle,end_angle,line_width,color}; 0°=3 o'clock, CW.
//  2. The WHOLE rose (U/T/S/B ticks + labels) now rotates so U points to true north,
//     like a real watch compass — not a frozen dial with only a tiny marker moving.
//  3. A ~120ms poll timer drives updates (with a 1° throttle) instead of relying only
//     on Compass.onChange, which the OS coalesces into coarse, laggy steps.
//     setFreqMode is NOT used — it is API_LEVEL 4.0+ and this app targets 3.0.
//  4. Degrade is no longer terminal: a compass that just needed a longer figure-8
//     recovers to live as soon as it calibrates.
//  5. Transient INVALID frames are debounced — no needle flicker / prompt flashing.
//  6. Haptic + colour + text confirmation when the watch faces qibla, plus a live
//     "Putar X° ke kiri/kanan" hint and distance to the Ka'bah.
//
// ⚠ PERMISSION: Compass needs device:os.compass (app.json). Zepp OS 3.0+.

import * as hmUI from '@zos/ui'
import { back } from '@zos/router'
import { Compass, Vibrator, VIBRATOR_SCENE_SHORT_STRONG } from '@zos/sensor'
import { C, F, BUILD, safeWidth, centerX } from './theme'
import { getLocation, locationLabel } from '../src/data/location'
import { bearingToKaaba, directionLabel, distanceToKaaba } from './qibla-calc'

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

/**
 * ARC with the correct x/y/w/h bounding box derived from a centre + radius.
 * (ARC ignores center_x/center_y — the b38 bug — and draws inside the box.)
 */
function arc(cx, cy, radius, startA, endA, lw, color) {
  return hmUI.createWidget(hmUI.widget.ARC, {
    x: cx - radius, y: cy - radius, w: radius * 2, h: radius * 2,
    radius: radius,
    start_angle: startA, end_angle: endA,
    line_width: lw, color: color,
  })
}

// ── kompas ring constants ──

var CX = 233, CY = 233
var RING_R = 130       // main ring radius
var LABEL_R = RING_R - 18   // cardinal labels sit just inside the ring (clears header)
var TICK_W = 4         // cardinal tick half-width in degrees
var MARKER_W = 10      // qibla marker half-width in degrees
var TOPREF_W = 3       // top reference half-width
var MARKER_R = RING_R - 6   // qibla needle + Ka'bah dot radius
var ALIGN_TOL = 5      // ± degrees counted as "facing qibla"
var POLL_MS = 120      // compass poll cadence
var LOST_DEBOUNCE = 6  // invalid frames tolerated before re-prompting calibration

// Cardinal points — world bearing (CW from true north) + Indonesian label.
// U (Utara) is highlighted gold so the user can orient the rotating rose at a glance.
var CARDS = [
  { txt: 'U', bearing: 0, col: C.gold },
  { txt: 'T', bearing: 90, col: C.textMd },
  { txt: 'S', bearing: 180, col: C.textMd },
  { txt: 'B', bearing: 270, col: C.textMd },
]

/** Screen-angle (0=top, clockwise) → ARC angle (0=3-o'clock, clockwise). */
function toArc(screenAngle) { return screenAngle - 90 }

/** Circular absolute difference in degrees, result in [0,180]. */
function circAbs(d) {
  d = ((d % 360) + 360) % 360
  return d > 180 ? 360 - d : d
}

/** Indonesian thousands grouping, e.g. 7900 → "7.900". */
function idNum(n) {
  var s = String(n), out = '', c = 0
  for (var i = s.length - 1; i >= 0; i--) {
    out = s[i] + out
    if (++c % 3 === 0 && i > 0) out = '.' + out
  }
  return out
}

Page({
  build() {
    hmUI.setLayerScrolling(false)
    fill(0, 0, 466, 466, C.bg)

    // ── location + bearing ──
    var loc = getLocation()
    var qiblaDeg = Math.round(bearingToKaaba(loc.lat, loc.lon))
    var qiblaDir = directionLabel(qiblaDeg)
    var locLbl = locationLabel(loc)
    var distKm = distanceToKaaba(loc.lat, loc.lon)

    // ── header ──
    label('Arah Kiblat', 0, 18, 466, 26, C.textMd, F.caption)
    label(qiblaDeg + '° ' + qiblaDir, 0, 46, 466, 48, C.gold, F.h1)
    label(locLbl, 0, 90, 466, 22, C.textLo, F.caption)

    // ── static compass ring (fixed boundary) ──
    arc(CX, CY, RING_R, 0, 360, 2, C.stroke)

    // ── rotating rose: cardinal ticks + labels (repositioned every update) ──
    var _ticks = []
    var _labels = []
    for (var i = 0; i < CARDS.length; i++) {
      // tick on the ring — box fixed, only its angles change on rotation
      _ticks.push(arc(CX, CY, RING_R, -90 - TICK_W, -90 + TICK_W, 5, i === 0 ? C.goldBright : C.textMd))
      // label just inside the ring — created centred, repositioned on rotation
      _labels.push(label(CARDS[i].txt, CX - 16, CY - LABEL_R - 12, 32, 24, CARDS[i].col, F.label))
    }

    // ── top reference pointer — static gold mark at 12 o'clock (arah hadap) ──
    arc(CX, CY, RING_R - 6, -90 - TOPREF_W, -90 + TOPREF_W, 7, C.goldBright)

    // ── qibla direction needle (DYNAMIC) — hidden until first placement ──
    var _marker = arc(CX, CY, MARKER_R, 0, 0, 12, C.emeraldBright)

    // Ka'bah dot riding the needle tip
    var _kaaba = hmUI.createWidget(hmUI.widget.CIRCLE, {
      center_x: CX, center_y: CY - MARKER_R, radius: 7, color: C.goldBright,
    })

    // Center dot + inner accent circle
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX, center_y: CY, radius: 6, color: C.gold })
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX, center_y: CY, radius: 70, color: C.goldDim })

    // Distance to the Ka'bah (static info, inside the ring)
    var wDist = safeWidth(292, 24, 220)
    label('~' + idNum(distKm) + ' km · Ka\'bah', centerX(wDist), 292, wDist, 24, C.textLo, 20)

    // ── calibration / turn-hint status area ──
    var _statusW = label('', 0, 358, 466, 30, C.textLo, F.caption)

    // ── back button (safe bezel) ──
    var btnY = 396, btnH = 38
    var btnW = safeWidth(btnY, btnH)
    var btnX = centerX(btnW)
    label('« Kembali', btnX, btnY, btnW, btnH, C.goldDim, F.label)
    tapZone(btnX, btnY, btnW, btnH, function () { back() })

    // ── BUILD marker ──
    label(BUILD, 0, 440, 466, 16, C.textLo, 14)

    function setStatus(text, color) {
      _statusW.setProperty(hmUI.prop.MORE, { text: text, color: color })
    }

    // ── rose + needle placement for a given heading ──
    // heading = watch-top bearing CW from true north (getDirectionAngle semantics).
    // Every world bearing B lands at screen angle (B - heading), 0 = top, CW.
    function drawRose(heading, live) {
      for (var j = 0; j < CARDS.length; j++) {
        var s = (CARDS[j].bearing - heading + 360) % 360
        var ac = toArc(s)
        _ticks[j].setProperty(hmUI.prop.MORE, { start_angle: ac - TICK_W, end_angle: ac + TICK_W })
        var sr = s * Math.PI / 180
        var lx = Math.round(CX + LABEL_R * Math.sin(sr))
        var ly = Math.round(CY - LABEL_R * Math.cos(sr))
        _labels[j].setProperty(hmUI.prop.MORE, { x: lx - 16, y: ly - 12, w: 32, h: 24 })
      }
      var sq = (qiblaDeg - heading + 360) % 360
      var acq = toArc(sq)
      var delta = ((sq + 180) % 360) - 180  // signed: >0 qibla to the right, <0 to the left
      var aligned = live && Math.abs(delta) <= ALIGN_TOL
      _marker.setProperty(hmUI.prop.MORE, {
        start_angle: acq - MARKER_W, end_angle: acq + MARKER_W,
        color: aligned ? C.goldBright : C.emeraldBright,
      })
      var sqr = sq * Math.PI / 180
      _kaaba.setProperty(hmUI.prop.MORE, {
        center_x: Math.round(CX + MARKER_R * Math.sin(sqr)),
        center_y: Math.round(CY - MARKER_R * Math.cos(sqr)),
        radius: 7,
      })
      return delta
    }

    // ── COMPASS SENSOR state ──
    var _compass = null
    var _hasCompass = false
    var _everLive = false        // have we shown at least one live heading?
    var _wasAligned = false
    var _lastHeading = null
    var _invalidStreak = 0
    var _stopped = false
    var _pollId = null

    // Haptics — one Vibrator, buzz once on entering the aligned zone.
    var _vib = null
    try { _vib = new Vibrator() } catch (e) { console.log('[qibla] vibrator init failed: ' + e) }
    function buzz() {
      try { if (_vib) { _vib.setMode(VIBRATOR_SCENE_SHORT_STRONG); _vib.start() } }
      catch (e) { console.log('[qibla] buzz err: ' + e) }
    }

    function readCompass() {
      if (!_hasCompass) return { ok: false }
      try {
        var st = _compass.getStatus()
        var a = _compass.getDirectionAngle()
        if (!st || a === 'INVALID') return { ok: false }
        var h = Number(a)
        if (isNaN(h)) return { ok: false }
        return { ok: true, heading: ((h % 360) + 360) % 360 }
      } catch (e) {
        console.log('[qibla] read err: ' + e)
        return { ok: false }
      }
    }

    function tick() {
      var r = readCompass()
      if (!r.ok) {
        _invalidStreak++
        // Only re-prompt after we had been live and lost the signal for a while —
        // avoids flicker on transient INVALID frames and on slow first calibration.
        if (_everLive && _invalidStreak >= LOST_DEBOUNCE) {
          setStatus('Sinyal kompas lemah — kalibrasi ulang (angka 8)', C.textLo)
        }
        return
      }
      _invalidStreak = 0
      var h = r.heading
      // throttle: skip sub-degree jitter once we are live (steady, no churn)
      if (_everLive && _lastHeading !== null && circAbs(h - _lastHeading) < 1) return
      _lastHeading = h
      _everLive = true

      var delta = drawRose(h, true)
      if (Math.abs(delta) <= ALIGN_TOL) {
        setStatus('✓ Menghadap kiblat', C.emeraldBright)
        if (!_wasAligned) { buzz(); _wasAligned = true }
      } else {
        _wasAligned = false
        setStatus('Putar ' + Math.abs(Math.round(delta)) + '° ke ' + (delta > 0 ? 'kanan' : 'kiri'), C.textMd)
      }
    }

    // Draw an initial static preview (north-up) so the face is never blank.
    drawRose(0, false)

    // Init Compass (try-catch: devices without a physical compass may throw)
    try {
      var c = new Compass()
      if (c && typeof c.start === 'function') { _compass = c; _hasCompass = true }
    } catch (e) {
      console.log('[qibla] Compass construction failed: ' + e)
    }

    if (_hasCompass) {
      setStatus('Kalibrasi: gerakkan jam membentuk angka 8', C.textLo)
      var _cb = function () { tick() }
      try {
        _compass.onChange(_cb)
        _compass.start()
        tick() // immediate first read
        // steady poll — the reliable driver (onChange is coarse / OS-coalesced)
        var loop = function () {
          if (_stopped) return
          tick()
          _pollId = setTimeout(loop, POLL_MS)
        }
        _pollId = setTimeout(loop, POLL_MS)

        this._compassCleanup = function () {
          _stopped = true
          if (_pollId) { clearTimeout(_pollId); _pollId = null }
          try { _compass.offChange(_cb) } catch (e) {}
          try { _compass.stop() } catch (e) {}
          try { if (_vib) _vib.stop() } catch (e) {}
          console.log('[qibla] onDestroy — compass stopped')
        }
      } catch (e) {
        console.log('[qibla] Compass start failed: ' + e)
        setStatus('Kompas tak tersedia — arahkan atas jam ke penanda hijau', C.textLo)
      }
    } else {
      // No physical compass: honest static fallback (the rose stays north-up).
      setStatus('Kompas tak tersedia — arahkan atas jam ke penanda hijau', C.textLo)
    }
  },

  onDestroy() {
    if (this._compassCleanup) {
      this._compassCleanup()
      this._compassCleanup = null
    }
  },
})
