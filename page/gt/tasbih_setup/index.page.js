import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { back, replace } from "@zos/router";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";

const PRESETS = [
  { label: "∞",     value: 0    },
  { label: "33×",   value: 33   },
  { label: "99×",   value: 99   },
  { label: "100×",  value: 100  },
  { label: "313×",  value: 313  },
  { label: "1000×", value: 1000 },
];

var screen       = "menu";
var customTarget = 100;
var wTarget      = null;

function loadTarget() {
  try {
    var t = parseInt(localStorage.getItem("tb_custom_target") || "100");
    customTarget = isNaN(t) || t < 0 ? 100 : Math.min(t, 9999);
  } catch (e) { customTarget = 100; }
}

function targetLabel(t) {
  return t === 0 ? "∞" : String(t);
}

function updateTarget() {
  if (wTarget) wTarget.setProperty(hmUI.prop.MORE, { text: targetLabel(customTarget) });
}

// ── Layar 1: Pilih Mode ───────────────────────────────────────────────
function buildMenu(W, H, CX, CY) {
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(60), y: px(48), w: W - px(120), h: px(46),
    text: "Pilih Mode", color: 0xFFD700, text_size: px(24),
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
  });
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: px(80), y: px(100), w: W - px(160), h: 1, color: 0xFFD700, alpha: 30,
  });

  // ── Dzikir 3 Sesi ────────────────────────────────────────────────────
  hmUI.createWidget(hmUI.widget.FILL_RECT, { x: px(40), y: px(114), w: W-px(80), h: px(104), color: 0x112211 });
  hmUI.createWidget(hmUI.widget.FILL_RECT, { x: px(40), y: px(114), w: px(5),    h: px(104), color: 0x43A047 });
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(54), y: px(120), w: W-px(100), h: px(38),
    text: "Dzikir 3 Sesi", color: 0xFFFFFF, text_size: px(22),
    align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
  });
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(54), y: px(162), w: W-px(100), h: px(50),
    text: "SubhanAllah · Alhamdulillah · Allahuakbar",
    color: 0x777777, text_size: px(14),
    align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
  });
  var tap1 = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: px(40), y: px(114), w: W-px(80), h: px(104), color: 0x000000, alpha: 1 });
  tap1.addEventListener(hmUI.event.CLICK_UP, function() {
    try {
      localStorage.setItem("tb_mode",    "dzikir3");
      localStorage.setItem("tb_count",   "0");
      localStorage.setItem("tb_session", "1");
    } catch (e) {}
    back();
  });

  // ── Custom Counter ────────────────────────────────────────────────────
  hmUI.createWidget(hmUI.widget.FILL_RECT, { x: px(40), y: px(232), w: W-px(80), h: px(104), color: 0x112211 });
  hmUI.createWidget(hmUI.widget.FILL_RECT, { x: px(40), y: px(232), w: px(5),    h: px(104), color: 0x29B6F6 });
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(54), y: px(238), w: W-px(100), h: px(38),
    text: "Custom Counter", color: 0xFFFFFF, text_size: px(22),
    align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
  });
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(54), y: px(280), w: W-px(100), h: px(50),
    text: "Target & dzikir bebas · ∞ atau angka tertentu",
    color: 0x777777, text_size: px(14),
    align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
  });
  var tap2 = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: px(40), y: px(232), w: W-px(80), h: px(104), color: 0x000000, alpha: 1 });
  tap2.addEventListener(hmUI.event.CLICK_UP, function() {
    replace({ url: "page/gt/tasbih_setup/index.page", params: "custom" });
  });

  // ── Sidebar ← ─────────────────────────────────────────────────────────
  hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: CY-px(46), w: px(32), h: px(92), color: 0x1a3322 });
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: 0, y: CY-px(46), w: px(32), h: px(92),
    text: "←", color: 0xFFD700, text_size: px(20),
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
  });
  var tapH = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: CY-px(46), w: px(32), h: px(92), color: 0x000000, alpha: 1 });
  tapH.addEventListener(hmUI.event.CLICK_UP, function() { back(); });
}

// ── Layar 2: Atur Target Custom ───────────────────────────────────────
function buildCustom(W, H, CX, CY) {
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(60), y: px(36), w: W-px(120), h: px(42),
    text: "Target Hitungan", color: 0xFFD700, text_size: px(21),
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
  });

  // ── 6 preset — 2 kolom × 3 baris ─────────────────────────────────────
  var cL = px(52), cR = px(264), cW = px(164), rH = px(44), rG = px(8), rY0 = px(88);
  for (var p = 0; p < PRESETS.length; p++) {
    var bx = (p % 2 === 0) ? cL : cR;
    var by = rY0 + Math.floor(p / 2) * (rH + rG);
    var pl = PRESETS[p].label;
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: bx, y: by, w: cW, h: rH, color: 0x1a3322 });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: bx, y: by, w: cW, h: rH,
      text: pl, color: 0xCCCCCC, text_size: px(19),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    (function(val) {
      var tp = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: bx, y: by, w: cW, h: rH, color: 0x000000, alpha: 1 });
      tp.addEventListener(hmUI.event.CLICK_UP, function() {
        customTarget = val;
        updateTarget();
      });
    })(PRESETS[p].value);
  }

  // ── ▲  angka  ▼ ──────────────────────────────────────────────────────
  var adjY = px(252);

  // ▲
  hmUI.createWidget(hmUI.widget.FILL_RECT, { x: px(52), y: adjY, w: px(84), h: px(54), color: 0x1a3322 });
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(52), y: adjY, w: px(84), h: px(54),
    text: "▲", color: 0xFFD700, text_size: px(26),
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
  });
  var tapUp = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: px(52), y: adjY, w: px(84), h: px(54), color: 0x000000, alpha: 1 });
  tapUp.addEventListener(hmUI.event.CLICK_UP, function() {
    customTarget = Math.min(9999, customTarget + 1);
    updateTarget();
  });

  // Angka target (besar, tengah)
  wTarget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(148), y: adjY, w: px(184), h: px(54),
    text: targetLabel(customTarget),
    color: 0xFFD700, text_size: px(42),
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
  });

  // ▼
  hmUI.createWidget(hmUI.widget.FILL_RECT, { x: px(344), y: adjY, w: px(84), h: px(54), color: 0x1a3322 });
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(344), y: adjY, w: px(84), h: px(54),
    text: "▼", color: 0xFFD700, text_size: px(26),
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
  });
  var tapDn = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: px(344), y: adjY, w: px(84), h: px(54), color: 0x000000, alpha: 1 });
  tapDn.addEventListener(hmUI.event.CLICK_UP, function() {
    customTarget = Math.max(0, customTarget - 1);
    updateTarget();
  });

  // ── Tombol ✓ Mulai ────────────────────────────────────────────────────
  hmUI.createWidget(hmUI.widget.FILL_RECT, { x: CX-px(80), y: px(324), w: px(160), h: px(48), color: 0x1a4a20 });
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: CX-px(80), y: px(324), w: px(160), h: px(48),
    text: "✓ Mulai", color: 0x7FFF00, text_size: px(22),
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
  });
  var tapOK = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: CX-px(80), y: px(324), w: px(160), h: px(48), color: 0x000000, alpha: 1 });
  tapOK.addEventListener(hmUI.event.CLICK_UP, function() {
    try {
      localStorage.setItem("tb_mode",          "custom");
      localStorage.setItem("tb_custom_target", String(customTarget));
      localStorage.setItem("tb_count",         "0");
    } catch (e) {}
    back();
  });

  // ── Sidebar ← (kembali ke menu) ───────────────────────────────────────
  hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: CY-px(46), w: px(32), h: px(92), color: 0x1a3322 });
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: 0, y: CY-px(46), w: px(32), h: px(92),
    text: "←", color: 0xFFD700, text_size: px(20),
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
  });
  var tapB = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: CY-px(46), w: px(32), h: px(92), color: 0x000000, alpha: 1 });
  tapB.addEventListener(hmUI.event.CLICK_UP, function() {
    replace({ url: "page/gt/tasbih_setup/index.page", params: "menu" });
  });
}

// ── Page ──────────────────────────────────────────────────────────────
Page({
  onInit(params) {
    screen = (params === "custom") ? "custom" : "menu";
    loadTarget();
  },
  build() {
    const { width: W, height: H } = getDeviceInfo();
    const CX = Math.floor(W / 2);
    const CY = Math.floor(H / 2);

    hmUI.setLayerScrolling(false);
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 0, w: W, h: H, color: 0x0a1a14 });

    if (screen === "custom") {
      buildCustom(W, H, CX, CY);
    } else {
      buildMenu(W, H, CX, CY);
    }
  },
});
