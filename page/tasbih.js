// Tasbih / Dzikir counter — Batch I
// Spec: docs/prompts/04-BATCH-LANJUTAN.md (BATCH I). Reuses proven patterns from
// page/index.js (label/fill/tapZone/safeWidth) + page/reader.js (store onInit/onDestroy).
// Ring progress = ARC widgets (track + fill), NOT 33 CIRCLE widgets.
//
// VERIFIED APIs (node_modules/@zeppos/device-types + docs.zepp.com 2026-07-20):
//  - ARC: x,y,w,h,radius,start_angle,end_angle,line_width,color. 0°=3 o'clock,
//    angles increase CLOCKWISE. Top = -90°. Live update via setProperty(hmUI.prop.MORE, {...}).
//  - Vibrator (@zos/sensor, class): new Vibrator() → setMode(SCENE) → start() → stop().
//    Per-count = VIBRATOR_SCENE_SHORT_STRONG, target-reached = VIBRATOR_SCENE_DURATION_LONG.
// TASHIH NOTE: the 5 Arabic preset strings below are NEW text (not from frozen source)
// → WAJIB ditashih Ahmed sebelum gate ditutup.
import * as hmUI from '@zos/ui'
import { back } from '@zos/router'
import { Vibrator, VIBRATOR_SCENE_SHORT_STRONG, VIBRATOR_SCENE_DURATION_LONG } from '@zos/sensor'
import { C, F, BUILD } from './theme'
import { get as storeGet, set as storeSet } from '../src/data/store'

// ── Presets (cyclical via the Preset button) ──
// Arabic uses ٱ (alef wasla) to match the basmalah convention already in the repo.
var PRESETS = [
  { ar: 'سُبْحَانَ ٱللَّه', target: 33 },          // Subhanallah
  { ar: 'ٱلْحَمْدُ لِلَّه', target: 33 },          // Alhamdulillah
  { ar: 'ٱللَّهُ أَكْبَر', target: 33 },            // Allahu Akbar
  { ar: 'لَا إِلَٰهَ إِلَّا ٱللَّه', target: 100 }, // La ilaha illallah
  { ar: 'أَسْتَغْفِرُ ٱللَّه', target: 100 },       // Astaghfirullah
]

// ── Layout (466×466 round, CX=CY=233) ──
var CX = 233
var RING_CY = 210
var RING_R = 150
var RING_LW = 10
var RING_X = CX - RING_R            // 83
var RING_Y = RING_CY - RING_R       // 60
var RING_BOX = RING_R * 2           // 300

// ── Module-scope state (so onDestroy can persist) ──
var _count = 0
var _presetIdx = 0
var _target = PRESETS[0].target
var _complete = false

// Widget refs (set in build, used by render fns in the same closure)
var _dzikrW = null
var _countW = null
var _targetW = null
var _fillArc = null

// ── Inline UI helpers (mirrors page/index.js) ──
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
function tapZone(x, y, w, h, cb) {
  var zone = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: x, y: y, w: w, h: h, color: C.bg, alpha: 1 })
  zone.addEventListener(hmUI.event.CLICK_DOWN, cb)
  return zone
}
var R_SAFE = 213
function safeWidth(y, h, max) {
  var dy = Math.max(Math.abs(y - CX), Math.abs(y + h - CX))
  if (dy >= R_SAFE) return 0
  return Math.min(max || 400, Math.floor(2 * Math.sqrt(R_SAFE * R_SAFE - dy * dy)) - 16)
}
function centerX(w) { return Math.round(CX - w / 2) }

// ── Haptics (one Vibrator instance, reused) ──
var _vibrator = new Vibrator()
function buzz(scene) {
  try { _vibrator.setMode(scene); _vibrator.start() } catch (e) { console.log('[tasbih] vibe err: ' + e) }
}

// ── Persistence (qp.tasbih.v1 via store.js) ──
function loadState() {
  try {
    var s = storeGet('tasbih') || {}
    var idx = parseInt(s.preset, 10)
    if (isNaN(idx) || idx < 0 || idx >= PRESETS.length) idx = 0
    _presetIdx = idx
    _target = PRESETS[idx].target
    var c = Number(s.count) || 0
    if (c < 0) c = 0
    if (c > _target) c = _target
    _count = c
    _complete = (c >= _target)
  } catch (e) {
    _presetIdx = 0; _target = PRESETS[0].target; _count = 0; _complete = false
    console.log('[tasbih] load err: ' + e)
  }
}
function saveState() {
  try {
    storeSet('tasbih', { count: _count, target: _target, preset: String(_presetIdx), ts: 0 })
  } catch (e) { console.log('[tasbih] save err: ' + e) }
}

// ── Render helpers (live-update widgets via setProperty) ──
function renderDzikir() {
  _dzikrW.setProperty(hmUI.prop.MORE, { text: PRESETS[_presetIdx].ar })
}
function renderTarget() {
  _targetW.setProperty(hmUI.prop.MORE, { text: 'Target: ' + _target })
}
function renderCount() {
  _countW.setProperty(hmUI.prop.MORE, {
    text: String(_count),
    color: _complete ? C.emeraldBright : C.textHi,
  })
}
function renderRing() {
  var sweep = _target > 0 ? Math.round(360 * _count / _target) : 0
  if (sweep > 360) sweep = 360
  _fillArc.setProperty(hmUI.prop.MORE, { start_angle: -90, end_angle: -90 + sweep })
}

Page({
  build() {
    hmUI.setLayerScrolling(false)
    loadState()

    // Background
    fill(0, 0, 466, 466, C.bg)

    // ── Progress ring (track + fill), one ARC each — NOT 33 circles ──
    // Track: full circle (0→360), dim.
    hmUI.createWidget(hmUI.widget.ARC, {
      x: RING_X, y: RING_Y, w: RING_BOX, h: RING_BOX, radius: RING_R,
      start_angle: 0, end_angle: 360, line_width: RING_LW, color: C.goldDim,
    })
    // Fill: from top (-90°) clockwise, sweep = count/target * 360.
    _fillArc = hmUI.createWidget(hmUI.widget.ARC, {
      x: RING_X, y: RING_Y, w: RING_BOX, h: RING_BOX, radius: RING_R,
      start_angle: -90, end_angle: -90, line_width: RING_LW, color: C.emeraldBright,
    })

    // ── Center column (inside the ring) ──
    var wDzikr = safeWidth(92, 36, 300)
    _dzikrW = label(PRESETS[_presetIdx].ar, centerX(wDzikr), 92, wDzikr, 36, C.gold, 26)

    var wCount = safeWidth(148, 120, 260)
    _countW = label(String(_count), centerX(wCount), 148, wCount, 120, _complete ? C.emeraldBright : C.textHi, F.display)

    var wTgt = safeWidth(292, 28, 240)
    _targetW = label('Target: ' + _target, centerX(wTgt), 292, wTgt, 28, C.textLo, 22)

    // Apply loaded state to the (now-created) updatable widgets
    renderRing()

    // ── Tap zone: the whole central area = +1 ──
    // Rect avoids the back button (top-left) and the bottom button row.
    tapZone(50, 55, 366, 300, function () {
      if (_complete || _count >= _target) {
        // Already at target → start a fresh round, counting this tap as the first
        _count = 1
        _complete = false
        buzz(VIBRATOR_SCENE_SHORT_STRONG)
      } else {
        _count = _count + 1
        if (_count >= _target) {
          _complete = true
          buzz(VIBRATOR_SCENE_DURATION_LONG)   // long strong buzz on completion
        } else {
          buzz(VIBRATOR_SCENE_SHORT_STRONG)    // short strong buzz per count
        }
      }
      renderCount()
      renderRing()
      saveState()
    })

    // ── Back affordance (top-left, ← proven glyph — already shipped in settings.js) ──
    tapZone(16, 10, 44, 44, function () { back() })
    label('←', 16, 10, 44, 44, C.textHi, 34)

    // ── Bottom buttons (safe chord): Reset · Preset ──
    var BTN_Y = 372, BTN_H = 40, BTN_GAP = 24
    var btnRowW = safeWidth(BTN_Y, BTN_H, 240)
    var btnW = Math.floor((btnRowW - BTN_GAP) / 2)
    var btnRowLeft = centerX(btnW * 2 + BTN_GAP)
    var resetX = btnRowLeft
    var presetX = btnRowLeft + btnW + BTN_GAP

    fill(resetX, BTN_Y, btnW, BTN_H, C.surface)
    label('Reset', resetX, BTN_Y, btnW, BTN_H, C.textMd, 20)
    tapZone(resetX, BTN_Y, btnW, BTN_H, function () {
      _count = 0; _complete = false
      renderCount(); renderRing(); saveState()
      buzz(VIBRATOR_SCENE_SHORT_STRONG)
    })

    fill(presetX, BTN_Y, btnW, BTN_H, C.surface)
    label('Preset', presetX, BTN_Y, btnW, BTN_H, C.gold, 20)
    tapZone(presetX, BTN_Y, btnW, BTN_H, function () {
      _presetIdx = (_presetIdx + 1) % PRESETS.length
      _target = PRESETS[_presetIdx].target
      _count = 0; _complete = false
      renderDzikir(); renderTarget(); renderCount(); renderRing(); saveState()
      buzz(VIBRATOR_SCENE_SHORT_STRONG)
    })

    // Build marker
    label(BUILD, 0, 432, 466, 22, C.textLo, 18)
  },

  onDestroy() {
    saveState()
    try { _vibrator.stop() } catch (e) { console.log('[tasbih] stop err: ' + e) }
  },
})
