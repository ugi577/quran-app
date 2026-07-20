// Qibla compass — Quran Premium Batch J
//
// b40 (POLISH, murni visual — logika Compass/sensor & qibla-calc TIDAK diubah):
//   Bezel tetap gaya G-Shock (ring + tick 30° + huruf U/T/S/B statik, presisi di
//   tepi ring) + SATU jarum kiblat emas (arrowhead runcing) yang berputar ke arah
//   qibla = (qiblaBearing − heading). Ikon Ka'bah minimalis di pusat. Layout
//   vertikal dirapikan: header → ring → jarak → status → «Kembali (tak overlap).
//   Semua ARC pakai bounding box x/y/w/h (helper arc()) — center_x/center_y milik
//   CIRCLE saja; ARC menggambar di dalam kotak x/y/w/h.
//
// b39 (fungsi): ARC box fix (root "statis"), poll ~120ms + throttle, degrade yang
//   bisa pulih, debounce INVALID, haptic + petunjuk arah. setFreqMode TIDAK dipakai
//   (API 4.0+, target 3.0).
//
// ⚠ PERMISSION: device:os.compass (app.json). Zepp OS 3.0+.

import * as hmUI from '@zos/ui'
import { back } from '@zos/router'
import { Compass, Vibrator, VIBRATOR_SCENE_SHORT_STRONG } from '@zos/sensor'
import { C, F, BUILD, safeWidth, centerX } from './theme'
import { getLocation, locationLabel } from '../src/data/location'
import { bearingToKaaba, directionLabel, distanceToKaaba } from './qibla-calc'

// ── helpers ──

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

/** ARC with the correct x/y/w/h bounding box (ARC ignores center_x/center_y). */
function arc(cx, cy, radius, startA, endA, lw, color) {
  return hmUI.createWidget(hmUI.widget.ARC, {
    x: cx - radius, y: cy - radius, w: radius * 2, h: radius * 2,
    radius: radius,
    start_angle: startA, end_angle: endA,
    line_width: lw, color: color,
  })
}

// ── geometry (compass centred on the screen centre) ──

var CX = 233, CY = 233
var RING_R = 100       // bezel ring + tick radius (compact — leaves room top+bottom)
var LABEL_R = 76       // U/T/S/B just inside the rim (di tepi, tidak menempel garis)
var ALIGN_TOL = 5      // ± degrees counted as "facing qibla"
var POLL_MS = 120
var LOST_DEBOUNCE = 6

// Qibla arrowhead: tapering stack of ARCs, sharp apex at the rim pointing OUTWARD
// to qibla (wide base near centre → sharp tip at the ring). One coherent gold needle.
var HEAD_SEGS = [
  { r: 84,  hw: 6.0, lw: 7 },
  { r: 89,  hw: 4.5, lw: 8 },
  { r: 94,  hw: 3.0, lw: 8 },
  { r: 98,  hw: 1.7, lw: 7 },
  { r: 100, hw: 0.7, lw: 6 },
]

// Fixed bezel cardinals (screen angle: 0 = top = U, clockwise).
var CARDS = [
  { txt: 'U', deg: 0 },
  { txt: 'T', deg: 90 },
  { txt: 'S', deg: 180 },
  { txt: 'B', deg: 270 },
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
    label('Arah Kiblat', 0, 14, 466, 24, C.textMd, F.caption)
    label(qiblaDeg + '° ' + qiblaDir, 0, 40, 466, 46, C.gold, F.h1)
    label(locLbl, 0, 88, 466, 22, C.textLo, F.caption)

    // ── bezel ring (thicker, clearer) ──
    arc(CX, CY, RING_R, 0, 360, 3, C.stroke)

    // ── tick marks every 30° + cardinals bolder (static bezel) ──
    for (var t = 0; t < 12; t++) {
      var td = t * 30
      var isCard = (td % 90 === 0)
      var ac = toArc(td)
      var thw = isCard ? 1.4 : 0.6
      arc(CX, CY, RING_R, ac - thw, ac + thw, isCard ? 8 : 4, isCard ? C.gold : C.goldDim)
    }

    // ── cardinal letters U/T/S/B — fixed, precise, upright, not bold ──
    for (var i = 0; i < CARDS.length; i++) {
      var sr = CARDS[i].deg * Math.PI / 180
      var lx = Math.round(CX + LABEL_R * Math.sin(sr))
      var ly = Math.round(CY - LABEL_R * Math.cos(sr))
      label(CARDS[i].txt, lx - 18, ly - 17, 36, 34, C.textMd, 28)
    }

    // ── Ka'bah glyph at centre (geometric silhouette — Zepp TEXT tak render emoji:
    //    kotak hitam ber-outline emas + pita hizam emas) ──
    fill(CX - 23, CY - 23, 46, 46, C.gold)   // gold border base
    fill(CX - 19, CY - 19, 38, 38, C.bg)     // black cube (leaves ~4px gold edge)
    fill(CX - 19, CY - 5, 38, 5, C.goldDim)  // hizam band

    // ── qibla arrowhead (DYNAMIC) — created here, positioned by drawRose ──
    var _head = []
    for (var s = 0; s < HEAD_SEGS.length; s++) {
      var seg = HEAD_SEGS[s]
      _head.push(arc(CX, CY, seg.r, toArc(0) - seg.hw, toArc(0) + seg.hw, seg.lw, C.gold))
    }

    // ── distance to the Ka'bah (below the ring) ──
    label('~' + idNum(distKm) + ' km ke Ka\'bah', 0, 337, 466, 24, C.textLo, F.caption)

    // ── calibration / turn-hint status (below distance) ──
    var _statusW = label('', 0, 365, 466, 28, C.textLo, F.caption)

    // ── back button (safe bezel — proven b38 config, lebar ≈125px di y=396) ──
    var btnY = 396, btnH = 38
    var btnW = safeWidth(btnY, btnH)
    var btnX = centerX(btnW)
    label('« Kembali', btnX, btnY, btnW, btnH, C.goldDim, F.label)
    tapZone(btnX, btnY, btnW, btnH, function () { back() })

    // ── BUILD marker ──
    label(BUILD, 0, 442, 466, 16, C.textLo, 14)

    function setStatus(text, color) {
      _statusW.setProperty(hmUI.prop.MORE, { text: text, color: color })
    }

    // ── qibla needle placement (ONLY the arrowhead moves; bezel is fixed) ──
    // heading = watch-top bearing CW from true north (getDirectionAngle semantics).
    // Qibla lands at screen angle P = (qiblaBearing − heading), 0 = top, CW.
    function drawRose(heading, live) {
      var P = (qiblaDeg - heading + 360) % 360
      var delta = ((P + 180) % 360) - 180  // >0 qibla to the right, <0 to the left
      var aligned = live && Math.abs(delta) <= ALIGN_TOL
      var col = aligned ? C.goldBright : C.gold
      var acP = toArc(P)
      for (var k = 0; k < _head.length; k++) {
        _head[k].setProperty(hmUI.prop.MORE, {
          start_angle: acP - HEAD_SEGS[k].hw,
          end_angle: acP + HEAD_SEGS[k].hw,
          color: col,
        })
      }
      return delta
    }

    // ── COMPASS SENSOR (unchanged from b39) ──
    var _compass = null
    var _hasCompass = false
    var _everLive = false
    var _wasAligned = false
    var _lastHeading = null
    var _invalidStreak = 0
    var _stopped = false
    var _pollId = null

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
        if (_everLive && _invalidStreak >= LOST_DEBOUNCE) {
          setStatus('Sinyal kompas lemah — kalibrasi ulang (angka 8)', C.textLo)
        }
        return
      }
      _invalidStreak = 0
      var h = r.heading
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

    // Initial static preview (north-up) so the needle is never blank.
    drawRose(0, false)

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
        tick()
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
        setStatus('Kompas tak tersedia — arahkan atas jam ke jarum emas', C.textLo)
      }
    } else {
      setStatus('Kompas tak tersedia — arahkan atas jam ke jarum emas', C.textLo)
    }
  },

  onDestroy() {
    if (this._compassCleanup) {
      this._compassCleanup()
      this._compassCleanup = null
    }
  },
})
