// Qibla compass — Quran Premium Batch J (b41 redesign)
//
// Full-screen rotating dial + orbiting Ka'bah pin. Paradigm: the compass ROSE
// (dial.png, with ticks + N/E/S/W) rotates, while the centre arrow and the top
// index stay FIXED (they represent the direction the user faces — always "up",
// since the watch is held facing the user). The Ka'bah pin orbits on the ring to
// the screen angle (qibla − heading). When the user faces qibla, the pin lands
// at 12 o'clock under the fixed arrow → alignment.
//
// ── Why widget.IMG, not IMG_POINTER (design-source deviation, verified) ──
// The redesign source used widget.IMG_POINTER. IMG_POINTER is only documented
// under /docs/watchface/ (watchface API), and its x/y mean "the image's own
// rotation pivot pixel" — under which the source's pin coords (x:201 in a 64px
// image) are impossible, i.e. the source was untested on a docs-faithful SDK.
// The DEVICE-APP widget.IMG (docs.zepp.com/.../device-app-api/.../IMG, API_LEVEL
// 2.0+) supports the SAME rotation (angle / center_x / center_y) with clear,
// unambiguous semantics (x,y = widget top-left), proven by the official clock-
// hand example. It achieves the identical rotating-dial effect on a verified
// device-app API (AGENTS rule #1). The pin orbits via x/y translation each frame
// (a marker needs no rotation).
//
// ── Reconciliations vs the redesign source ──
//  • Colours → theme.js tokens (no hardcoded hex in the page; hex-gate clean).
//  • Location → getLocation() from src/data/location (the SAME source Jadwal
//    Sholat uses). The source's own Geolocation + localStorage('qibla_pos')
//    was removed — Qibla must follow the city the user picked in Jadwal Sholat.
//  • Compass/Vibrator → static import (proven since b38), not dynamic require().
//  • getStatus() returns BOOLEAN (not 0–3 the source assumed) — calibrated = st.
//  • i18n getText() → hardcoded Indonesian (getText is unproven in this repo;
//    every other page hardcodes). Text taken from the redesign's id-ID.po.
//  • Lock ±4° (design spec). Haptic once on align (Vibrator SHORT_STRONG).
//  • Magnetic declination (Indonesia table) folded into qibla-calc.js.
//
// ⚠ PERMISSION: device:os.compass (app.json). Zepp OS 3.0+.

import * as hmUI from '@zos/ui'
import { setPageBrightTime } from '@zos/display'
import { Compass, Vibrator, VIBRATOR_SCENE_SHORT_STRONG } from '@zos/sensor'
import { C, F } from './theme'
import { getLocation, locationLabel } from '../src/data/location'
import {
  bearingToKaaba, directionLabel, distanceToKaaba,
  magneticDeclination, norm, angleDiff, turnDirection,
} from './qibla-calc'

// ── geometry ──
var W = 466, CX = 233, CY = 233
var ORBIT = 137          // Ka'bah pin orbit radius (design value; pin spans r105–169, clear of bezel r213)
var PIN = 64             // pin image edge
var ARROW_W = 74, ARROW_H = 52
var INDEX_S = 14
var TOL = 4              // ±deg counted as "facing qibla" (design spec)
var SMOOTH = 0.25        // heading low-pass factor
var POLL_MS = 120        // compass poll (onChange alone is coalesced by the OS — b39 lesson)
var LOST_DEBOUNCE = 6    // consecutive invalid reads before "calibrate" nudge
var ASSET = 'raw/qibla/' // assets/raw/qibla/*.png — raw/ is the only wholesale-bundled asset folder here

// ── helpers ──
function label(text, x, y, w, h, color, size) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x: x, y: y, w: w, h: h, color: color,
    text_size: size, text: text,
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
  })
}

function fill(x, y, w, h, color) {
  return hmUI.createWidget(hmUI.widget.FILL_RECT, { x: x, y: y, w: w, h: h, color: color })
}

/** Indonesian thousands grouping, e.g. 7935 → "7.935". */
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
    try { setPageBrightTime({ brightTime: 120000 }) } catch (e) { console.log('[qibla] brightTime: ' + e) }
    fill(0, 0, W, W, C.bg)

    // ── location + bearing (REUSED from src/data/location — same as Jadwal Sholat) ──
    var loc = getLocation()
    var qibla = bearingToKaaba(loc.lat, loc.lon)
    var declination = magneticDeclination(loc.lat, loc.lon)
    var distKm = distanceToKaaba(loc.lat, loc.lon)
    var qiblaDir = directionLabel(qibla)
    var locLbl = locationLabel(loc)

    // ── rotating dial (full-screen IMG, rotates around screen centre) ──
    var dial = hmUI.createWidget(hmUI.widget.IMG, {
      x: 0, y: 0, w: W, h: W,
      pos_x: 0, pos_y: 0,
      center_x: CX, center_y: CY,
      src: ASSET + 'dial.png', angle: 0,
    })

    // ── orbiting Ka'bah pin (translated each frame; initial = top of ring) ──
    var pin = hmUI.createWidget(hmUI.widget.IMG, {
      x: CX - PIN / 2, y: CY - ORBIT - PIN / 2,
      src: ASSET + 'pin_kaaba.png',
    })

    // ── fixed top index (12 o'clock reference) ──
    hmUI.createWidget(hmUI.widget.IMG, {
      x: CX - INDEX_S / 2, y: 22, src: ASSET + 'index.png',
    })

    // ── fixed centre arrow (user's facing direction; swaps to green on lock) ──
    var arrow = hmUI.createWidget(hmUI.widget.IMG, {
      x: CX - ARROW_W / 2, y: CY - 96, src: ASSET + 'arrow.png',
    })

    // ── texts over the dial centre ──
    var deg = label('0°', 0, CY - 36, W, 74, C.textHi, F.h1)
    var info = label(
      'Kiblat ' + Math.round(qibla) + '° ' + qiblaDir + '  ·  ' + idNum(distKm) + ' km  ·  ' + locLbl,
      0, CY + 46, W, 24, C.textLo, 18
    )
    var status = label('', 0, 312, W, 26, C.textLo, F.label)

    function setStatus(text, color) {
      status.setProperty(hmUI.prop.MORE, { text: text, color: color })
    }

    // ── heading state (true north, low-pass smoothed) ──
    var heading = 0
    var firstReading = true
    var wasAligned = false

    function smoothHeading(raw) {
      var d = ((raw - heading + 540) % 360) - 180
      heading = norm(heading + d * SMOOTH)
    }

    /** Place the dial + pin for the current heading; update lock state. */
    function draw() {
      // Dial rotates OPPOSITE to heading (paradigm-2 compass: the rose turns so
      // the faced cardinal slides under the fixed top index).
      dial.setProperty(hmUI.prop.MORE, { angle: -heading, center_x: CX, center_y: CY })

      // Pin orbits to the qibla screen angle (0 = top).
      var P = norm(qibla - heading)
      var pr = P * Math.PI / 180
      var pcx = CX + ORBIT * Math.sin(pr)
      var pcy = CY - ORBIT * Math.cos(pr)
      pin.setProperty(hmUI.prop.MORE, {
        x: Math.round(pcx - PIN / 2), y: Math.round(pcy - PIN / 2),
      })

      deg.setProperty(hmUI.prop.MORE, { text: Math.round(heading) + '°' })

      var off = angleDiff(heading, qibla)
      var nowLocked = off <= TOL
      if (nowLocked !== wasAligned) {
        wasAligned = nowLocked
        applyLock(nowLocked)
      }
      if (nowLocked) {
        setStatus('✓ Menghadap kiblat', C.emeraldBright)
      } else {
        var turn = turnDirection(heading, qibla)
        setStatus('Putar ' + Math.round(off) + '° ke ' + (turn > 0 ? 'kanan' : 'kiri'), C.textMd)
      }
    }

    /** Swap arrow/pin/degree colour on the align transition; haptic once on lock. */
    function applyLock(on) {
      var P = norm(qibla - heading), pr = P * Math.PI / 180
      var px = Math.round(CX + ORBIT * Math.sin(pr) - PIN / 2)
      var py = Math.round(CY - ORBIT * Math.cos(pr) - PIN / 2)
      pin.setProperty(hmUI.prop.MORE, {
        src: ASSET + (on ? 'pin_kaaba_lock.png' : 'pin_kaaba.png'),
        x: px, y: py,
      })
      arrow.setProperty(hmUI.prop.MORE, { src: ASSET + (on ? 'arrow_lock.png' : 'arrow.png') })
      deg.setProperty(hmUI.prop.MORE, { color: on ? C.emeraldBright : C.textHi })
      if (on) buzz()
    }

    // ── Compass sensor (proven b38–b40 lifecycle: onChange + poll, boolean status) ──
    var compass = null
    var hasCompass = false
    var stopped = false
    var pollId = null
    var invalidStreak = 0
    var cb = null

    var vib = null
    try { vib = new Vibrator() } catch (e) { console.log('[qibla] vibrator init: ' + e) }
    function buzz() {
      try {
        if (vib) { vib.setMode(VIBRATOR_SCENE_SHORT_STRONG); vib.start() }
      } catch (e) { console.log('[qibla] buzz: ' + e) }
    }

    function readCompass() {
      if (!hasCompass) return { ok: false }
      try {
        var st = compass.getStatus()
        var a = compass.getDirectionAngle()
        if (!st || a === 'INVALID') return { ok: false }
        var h = Number(a)
        if (isNaN(h)) return { ok: false }
        return { ok: true, heading: norm(h + declination) } // magnetic → true north
      } catch (e) {
        console.log('[qibla] read: ' + e)
        return { ok: false }
      }
    }

    function tick() {
      var r = readCompass()
      if (!r.ok) {
        invalidStreak++
        if (invalidStreak >= LOST_DEBOUNCE) {
          setStatus('Sinyal kompas lemah — gerakkan jam membentuk angka 8', C.textLo)
        }
        return
      }
      invalidStreak = 0
      if (firstReading) { heading = r.heading; firstReading = false }
      else smoothHeading(r.heading)
      draw()
    }

    // Static north-up preview so the dial is never blank before the first read.
    draw()

    try {
      var c = new Compass()
      if (c && typeof c.start === 'function') { compass = c; hasCompass = true }
    } catch (e) {
      console.log('[qibla] Compass construction failed: ' + e)
    }

    if (hasCompass) {
      setStatus('Kalibrasi: gerakkan jam membentuk angka 8', C.textLo)
      cb = function () { tick() }
      try {
        compass.onChange(cb)
        compass.start()
        tick()
        var loop = function () {
          if (stopped) return
          tick()
          pollId = setTimeout(loop, POLL_MS)
        }
        pollId = setTimeout(loop, POLL_MS)
      } catch (e) {
        console.log('[qibla] Compass start failed: ' + e)
        hasCompass = false
      }
    }
    if (!hasCompass) {
      setStatus('Kompas tak tersedia — kiblat ' + Math.round(qibla) + '° ' + qiblaDir, C.textLo)
    }

    this._compassCleanup = function () {
      stopped = true
      if (pollId) { clearTimeout(pollId); pollId = null }
      if (compass) {
        try { if (cb) compass.offChange(cb) } catch (e) {}
        try { compass.stop() } catch (e) {}
      }
      try { if (vib) vib.stop() } catch (e) {}
      console.log('[qibla] onDestroy — compass stopped')
    }
  },

  onDestroy() {
    if (this._compassCleanup) {
      this._compassCleanup()
      this._compassCleanup = null
    }
  },
})
