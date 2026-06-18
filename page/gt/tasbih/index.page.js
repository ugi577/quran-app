import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { back } from "@zos/router";
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

var count   = 0;
var session = 1;  // 1–3 aktif, > 3 = selesai semua

var arcProgress  = null;
var wCount       = null;
var wSession     = null;
var wDzikirAr    = null;
var wDzikirLatin = null;

// ── Storage ───────────────────────────────────────────────────────────
function loadState() {
  try {
    var c = parseInt(localStorage.getItem("tb_count")   || "0");
    var s = parseInt(localStorage.getItem("tb_session") || "1");
    count   = isNaN(c) || c < 0 ? 0 : c;
    session = isNaN(s) || s < 1 ? 1 : s;
  } catch (e) {
    count = 0; session = 1;
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

// ── Helpers ───────────────────────────────────────────────────────────
function isCompleted() { return session > TOTAL_SESSIONS; }

function dzikir() {
  return DZIKIR[Math.min(session - 1, TOTAL_SESSIONS - 1)];
}

// ── Refresh semua widget dinamis ─────────────────────────────────────
function refresh() {
  var done = isCompleted();
  var dz   = dzikir();

  if (wCount) wCount.setProperty(hmUI.prop.MORE, {
    text: done ? "99" : String(count),
  });

  if (wSession) wSession.setProperty(hmUI.prop.MORE, {
    text:  done ? "Selesai! 99×" : ("Sesi " + session + " / " + TOTAL_SESSIONS),
    color: done ? 0x43A047 : 0x888888,
  });

  if (wDzikirAr) wDzikirAr.setProperty(hmUI.prop.MORE, {
    text:  done ? "لا إله إلا الله" : dz.ar,
    color: done ? 0x43A047 : 0xFFD700,
  });

  if (wDzikirLatin) wDzikirLatin.setProperty(hmUI.prop.MORE, {
    text:  done ? "Tap untuk mengulang" : dz.latin,
    color: done ? 0x43A047 : 0x888888,
  });

  var arcDeg = done ? 360 : Math.round((count / TARGET) * 360);
  if (arcProgress) arcProgress.setProperty(hmUI.prop.MORE, { end_angle: arcDeg });
}

// ── Tap handler: +1 hitungan ──────────────────────────────────────────
function onTap() {
  if (isCompleted()) {
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
      session = TOTAL_SESSIONS + 1;  // tandai selesai
    } else {
      session++;
      count = 0;
    }
  }

  saveState();
  refresh();
}

function onReset() {
  count = 0; session = 1;
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
    var done = isCompleted();
    var dz   = dzikir();

    hmUI.setLayerScrolling(false);

    // Background hijau islami gelap
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 0, w: W, h: H, color: 0x0a1a14 });

    // ── Progress ring track (cincin penuh redup) ──────────────────────
    hmUI.createWidget(hmUI.widget.ARC, {
      center_x: CX, center_y: CY,
      radius: px(224), start_angle: 0, end_angle: 360,
      color: 0x1a3322, line_width: px(8),
    });

    // ── Progress ring emas sesuai hitungan ────────────────────────────
    var initDeg = done ? 360 : Math.round((count / TARGET) * 360);
    arcProgress = hmUI.createWidget(hmUI.widget.ARC, {
      center_x: CX, center_y: CY,
      radius: px(224), start_angle: 0, end_angle: initDeg,
      color: 0xFFD700, line_width: px(8),
    });

    // ── Nomor sesi ────────────────────────────────────────────────────
    wSession = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(80), y: px(90), w: W - px(160), h: px(36),
      text:  done ? "Selesai! 99×" : ("Sesi " + session + " / " + TOTAL_SESSIONS),
      color: done ? 0x43A047 : 0x888888,
      text_size: px(19),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // ── Nama dzikir Arab ──────────────────────────────────────────────
    wDzikirAr = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(136), w: W - px(120), h: px(52),
      text:  done ? "لا إله إلا الله" : dz.ar,
      color: done ? 0x43A047 : 0xFFD700,
      text_size: px(28),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // ── Angka hitungan besar ──────────────────────────────────────────
    wCount = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: CY - px(56), w: W - px(120), h: px(112),
      text: done ? "99" : String(count),
      color: 0xFFD700, text_size: px(80),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // ── Nama dzikir Latin ─────────────────────────────────────────────
    wDzikirLatin = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: CY + px(62), w: W - px(80), h: px(36),
      text:  done ? "Tap untuk mengulang" : dz.latin,
      color: done ? 0x43A047 : 0x888888,
      text_size: px(18),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // ── Tombol Reset ──────────────────────────────────────────────────
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - px(50), y: CY + px(112), w: px(100), h: px(40), color: 0x1a3322,
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(50), y: CY + px(112), w: px(100), h: px(40),
      text: "↺ Reset", color: 0x888888, text_size: px(18),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // ── HOME sidebar kiri ─────────────────────────────────────────────
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: CY - px(46), w: px(32), h: px(92), color: 0x1a3322,
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: CY - px(46), w: px(32), h: px(92),
      text: "←", color: 0xFFD700, text_size: px(20),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // ── Tap areas (dibuat terakhir = paling atas = event diprioritaskan) ──

    // Seluruh layar → +1 hitungan
    var tapScreen = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H, color: 0x000000, alpha: 1,
    });
    tapScreen.addEventListener(hmUI.event.CLICK_UP, onTap);

    // Reset (menimpa tap-screen di area tombol reset)
    var tapReset = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - px(50), y: CY + px(112), w: px(100), h: px(40), color: 0x000000, alpha: 1,
    });
    tapReset.addEventListener(hmUI.event.CLICK_UP, onReset);

    // Home (menimpa tap-screen di sidebar kiri)
    var tapHome = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: CY - px(46), w: px(32), h: px(92), color: 0x000000, alpha: 1,
    });
    tapHome.addEventListener(hmUI.event.CLICK_UP, function() { back(); });
  },
});
