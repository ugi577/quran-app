import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { back, push } from "@zos/router";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";
import { Vibrator } from "@zos/sensor";

const DZIKIR = [
  { ar: "سبحان الله",  latin: "SubhanAllah"  },
  { ar: "الحمد لله",  latin: "Alhamdulillah" },
  { ar: "الله أكبر",  latin: "Allahuakbar"   },
];
const TARGET         = 33;
const TOTAL_SESSIONS = 3;

var tbMode       = "dzikir3";
var customTarget = 100;
var count        = 0;
var session      = 1;

var arcProgress  = null;
var wCount       = null;
var wSession     = null;
var wDzikirAr    = null;
var wDzikirLatin = null;

// ── Storage ───────────────────────────────────────────────────────────
function loadState() {
  try {
    var c = parseInt(localStorage.getItem("tb_count")         || "0");
    var s = parseInt(localStorage.getItem("tb_session")       || "1");
    var m =         localStorage.getItem("tb_mode")           || "dzikir3";
    var t = parseInt(localStorage.getItem("tb_custom_target") || "100");
    count        = isNaN(c) || c < 0 ? 0 : c;
    session      = isNaN(s) || s < 1 ? 1 : s;
    tbMode       = (m === "custom") ? "custom" : "dzikir3";
    customTarget = isNaN(t) || t < 0 ? 100 : Math.min(t, 9999);
  } catch (e) {
    count = 0; session = 1; tbMode = "dzikir3"; customTarget = 100;
  }
}

function saveState() {
  try {
    localStorage.setItem("tb_count",   String(count));
    localStorage.setItem("tb_session", String(session));
  } catch (e) {}
}

// ── Vibrate ───────────────────────────────────────────────────────────
function vibrate(long) {
  try {
    var v = new Vibrator();
    v.start(long ? 23 : 22);
    setTimeout(function() { try { v.stop(); } catch (e2) {} }, long ? 1200 : 280);
  } catch (e) {}
}

// ── Dzikir3 helpers ───────────────────────────────────────────────────
function isD3Done()  { return session > TOTAL_SESSIONS; }
function curDzikir() { return DZIKIR[Math.min(session - 1, TOTAL_SESSIONS - 1)]; }

// ── Custom helpers ────────────────────────────────────────────────────
function isCustomDone() { return customTarget > 0 && count >= customTarget; }

// ── Display value helpers ─────────────────────────────────────────────
function getCountText() {
  if (tbMode === "custom") return String(count);
  return isD3Done() ? "99" : String(count);
}

function getSessionText() {
  if (tbMode === "custom") {
    if (isCustomDone()) return "Selesai! ✓";
    return customTarget === 0 ? "Custom  ∞" : "Custom  " + customTarget + "×";
  }
  return isD3Done() ? "Selesai! 99×" : "Sesi " + session + " / " + TOTAL_SESSIONS;
}

function getSessionColor() {
  if (tbMode === "custom") return isCustomDone() ? 0x43A047 : 0x29B6F6;
  return isD3Done() ? 0x43A047 : 0x888888;
}

function getArText() {
  if (tbMode === "custom") return "التسبيح";
  return isD3Done() ? "لا إله إلا الله" : curDzikir().ar;
}

function getArColor() {
  if (tbMode === "custom") return isCustomDone() ? 0x43A047 : 0xFFD700;
  return isD3Done() ? 0x43A047 : 0xFFD700;
}

function getLatinText() {
  if (tbMode === "custom") {
    if (isCustomDone()) return "Tap untuk mengulang";
    return customTarget === 0 ? "Tak terbatas" : customTarget + " hitungan";
  }
  return isD3Done() ? "Tap untuk mengulang" : curDzikir().latin;
}

function getLatinColor() {
  if (tbMode === "custom") return isCustomDone() ? 0x43A047 : 0x888888;
  return isD3Done() ? 0x43A047 : 0x888888;
}

function getArcDeg() {
  if (tbMode === "custom") {
    if (isCustomDone()) return 360;
    if (customTarget === 0) return Math.round((count % 100) / 100 * 360);
    return Math.round((count / customTarget) * 360);
  }
  return isD3Done() ? 360 : Math.round((count / TARGET) * 360);
}

// ── Refresh semua widget ──────────────────────────────────────────────
function refresh() {
  if (wCount)      wCount.setProperty(hmUI.prop.MORE,      { text:  getCountText() });
  if (wSession)    wSession.setProperty(hmUI.prop.MORE,    { text:  getSessionText(),  color: getSessionColor() });
  if (wDzikirAr)   wDzikirAr.setProperty(hmUI.prop.MORE,  { text:  getArText(),       color: getArColor()      });
  if (wDzikirLatin) wDzikirLatin.setProperty(hmUI.prop.MORE, { text: getLatinText(), color: getLatinColor()   });
  if (arcProgress)  arcProgress.setProperty(hmUI.prop.MORE,  { end_angle: getArcDeg() });
}

// ── Tap: +1 hitungan ─────────────────────────────────────────────────
function onTap() {
  if (tbMode === "custom") {
    if (isCustomDone()) {
      count = 0;
      saveState();
      refresh();
      return;
    }
    count++;
    if (customTarget > 0 && count >= customTarget) vibrate(true);
    saveState();
    refresh();
    return;
  }

  // Mode dzikir3
  if (isD3Done()) {
    count = 0; session = 1;
    saveState();
    refresh();
    return;
  }

  count++;
  if (count >= TARGET) {
    var isLast = (session >= TOTAL_SESSIONS);
    vibrate(isLast);
    if (isLast) {
      session = TOTAL_SESSIONS + 1;
    } else {
      session++;
      count = 0;
    }
  }

  saveState();
  refresh();
}

function onReset() {
  count = 0;
  if (tbMode === "dzikir3") session = 1;
  saveState();
  refresh();
}

// ── Page ──────────────────────────────────────────────────────────────
Page({
  build() {
    loadState();

    const { width: W, height: H } = getDeviceInfo();
    const CX = Math.floor(W / 2);
    const CY = Math.floor(H / 2);

    hmUI.setLayerScrolling(false);

    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 0, w: W, h: H, color: 0x0a1a14 });

    // Progress ring track
    hmUI.createWidget(hmUI.widget.ARC, {
      center_x: CX, center_y: CY,
      radius: px(224), start_angle: 0, end_angle: 360,
      color: 0x1a3322, line_width: px(8),
    });

    // Progress ring emas
    arcProgress = hmUI.createWidget(hmUI.widget.ARC, {
      center_x: CX, center_y: CY,
      radius: px(224), start_angle: 0, end_angle: getArcDeg(),
      color: 0xFFD700, line_width: px(8),
    });

    // Mode / sesi
    wSession = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(80), y: px(90), w: W - px(160), h: px(36),
      text: getSessionText(), color: getSessionColor(), text_size: px(19),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Dzikir Arab
    wDzikirAr = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(136), w: W - px(120), h: px(52),
      text: getArText(), color: getArColor(), text_size: px(28),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Angka hitungan besar
    wCount = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: CY - px(56), w: W - px(120), h: px(112),
      text: getCountText(), color: 0xFFD700, text_size: px(80),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Dzikir Latin / keterangan target
    wDzikirLatin = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: CY + px(62), w: W - px(80), h: px(36),
      text: getLatinText(), color: getLatinColor(), text_size: px(18),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // ── Tombol bawah: Reset (kiri) + Mode (kanan) ─────────────────────
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX-px(96), y: CY+px(112), w: px(92), h: px(40), color: 0x1a3322,
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX-px(96), y: CY+px(112), w: px(92), h: px(40),
      text: "↺ Reset", color: 0x888888, text_size: px(17),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX+px(4), y: CY+px(112), w: px(92), h: px(40), color: 0x1a3322,
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX+px(4), y: CY+px(112), w: px(92), h: px(40),
      text: "⚙ Mode", color: 0x29B6F6, text_size: px(17),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Sidebar ←
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: CY-px(46), w: px(32), h: px(92), color: 0x1a3322 });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: CY-px(46), w: px(32), h: px(92),
      text: "←", color: 0xFFD700, text_size: px(20),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // ── Tap areas ─────────────────────────────────────────────────────
    var tapScreen = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H, color: 0x000000, alpha: 1,
    });
    tapScreen.addEventListener(hmUI.event.CLICK_UP, onTap);

    var tapReset = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX-px(96), y: CY+px(112), w: px(92), h: px(40), color: 0x000000, alpha: 1,
    });
    tapReset.addEventListener(hmUI.event.CLICK_UP, onReset);

    var tapMode = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX+px(4), y: CY+px(112), w: px(92), h: px(40), color: 0x000000, alpha: 1,
    });
    tapMode.addEventListener(hmUI.event.CLICK_UP, function() {
      push({ url: "page/gt/tasbih_setup/index.page", params: "menu" });
    });

    var tapHome = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: CY-px(46), w: px(32), h: px(92), color: 0x000000, alpha: 1,
    });
    tapHome.addEventListener(hmUI.event.CLICK_UP, function() { back(); });
  },

  onResume() {
    loadState();
    refresh();
  },
});
