import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { px } from "@zos/utils";
import { push } from "@zos/router";
import { scrollTo } from "@zos/page";
import { DEVICE_WIDTH, PAD, W, ITEM_H, HEADER_H } from "zosLoader:./index.page.[pf].layout.js";
import { readAssetJSON } from "../../../utils/index.js";

const logger = Logger.getLogger("surah-list");

// Satu layar = 480px, tombol lompat satu layar setiap ketuk
const SCROLL_STEP = 480;

// Posisi tombol dalam koordinat LAYAR (bukan konten) — dihitung aman di dalam lingkaran
// Layar bulat 480px: radius=240, center=(240,240)
// ▲ di atas tengah: (180,10) lebar 120 — sudut (180,10) dist≈238 dari center ✓
// ▼ di bawah tengah: (180,415) lebar 120 — sudut (300,470) dist≈238 dari center ✓
const BTN_UP = { x: 180, y: 10,  w: 120, h: 55 };
const BTN_DN = { x: 180, y: 415, w: 120, h: 55 };

let _vY = 0;         // posisi viewport saat ini (0=atas, negatif=scroll ke bawah)
let _maxScroll = 0;  // batas scroll maksimum = totalContentH - 480
let _upBg, _upFg, _dnBg, _dnFg;

// Perbarui posisi tombol agar tetap "mengapung" di posisi layar yang sama
function _syncBtns() {
  const off = -_vY; // positif saat scroll ke bawah
  _upBg.setProperty(hmUI.prop.MORE, { y: BTN_UP.y + off });
  _upFg.setProperty(hmUI.prop.MORE, { y: BTN_UP.y + off });
  _dnBg.setProperty(hmUI.prop.MORE, { y: BTN_DN.y + off });
  _dnFg.setProperty(hmUI.prop.MORE, { y: BTN_DN.y + off });
}

// Buat tombol semi-transparan; kembalikan fg (TEXT) untuk addEventListener
function _mkBtn(bx, by, bw, bh, label) {
  const bg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: bx, y: by, w: bw, h: bh,
    color: 0x000000, alpha: 180,
  });
  const fg = hmUI.createWidget(hmUI.widget.TEXT, {
    x: bx, y: by, w: bw, h: bh,
    text: label, color: 0xFFD700, text_size: px(26),
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
  });
  return { bg, fg };
}

Page({
  onInit() {
    _vY = 0;
    _maxScroll = 0;
  },

  build() {
    // Matikan swipe-scroll bawaan OS — scroll sepenuhnya dikendalikan tombol
    hmUI.setLayerScrolling(false);

    const list = readAssetJSON("data/index.json");
    if (!list) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: px(200), w: W, h: px(60),
        text: "Gagal memuat data",
        color: 0xFF4444, text_size: px(22),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      return;
    }

    // Header
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(14), w: W, h: px(46),
      text: "القرآن الكريم",
      color: 0xFFD700, text_size: px(28),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    let y = HEADER_H;

    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const itemY = y;

      // Nama Arab
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: itemY + px(8), w: W - px(30), h: px(40),
        text: s.ar, color: 0xFFFFFF, text_size: px(24),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      // Info subtitle
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: itemY + px(52), w: W - px(30), h: px(28),
        text: s.en + "  ·  " + s.a + " ayat  ·  Hal. " + s.p,
        color: 0x666666, text_size: px(17),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      // Ikon ▶ di pojok kanan — tanda item bisa di-tap
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + W - px(28), y: itemY + px(28), w: px(24), h: px(40),
        text: "›", color: 0x888888, text_size: px(26),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      // Garis pemisah
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: itemY + ITEM_H - px(1), w: W, h: px(1), color: 0x2a2a2a,
      });

      // Area tap transparan menutupi seluruh baris — lebih andal dari click_func
      const tap = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: itemY, w: W, h: ITEM_H,
        color: 0x000000, alpha: 1,
      });
      tap.addEventListener(hmUI.event.CLICK_DOWN, (function(p) {
        return function() {
          push({ url: "page/gt/surah_view/index.page", params: String(p) });
        };
      })(s.p)); // s.p = halaman mushaf pertama surah

      y += ITEM_H;
    }

    _maxScroll = Math.max(0, y - 480);

    // ── Tombol mengapung (dibuat TERAKHIR supaya di atas konten) ──────────
    const up = _mkBtn(BTN_UP.x, BTN_UP.y, BTN_UP.w, BTN_UP.h, "▲"); // ▲
    _upBg = up.bg; _upFg = up.fg;
    up.fg.addEventListener(hmUI.event.CLICK_DOWN, function() {
      if (_vY >= 0) return;
      _vY = Math.min(0, _vY + SCROLL_STEP);
      scrollTo({ y: _vY });
      _syncBtns();
    });

    const dn = _mkBtn(BTN_DN.x, BTN_DN.y, BTN_DN.w, BTN_DN.h, "▼"); // ▼
    _dnBg = dn.bg; _dnFg = dn.fg;
    dn.fg.addEventListener(hmUI.event.CLICK_DOWN, function() {
      if (_vY <= -_maxScroll) return;
      _vY = Math.max(-_maxScroll, _vY - SCROLL_STEP);
      scrollTo({ y: _vY });
      _syncBtns();
    });
  },

  onDestroy() {
    logger.debug("surah list destroy");
  },
});
