import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { push } from "@zos/router";
import { DEVICE_WIDTH, DEVICE_HEIGHT, PAD, W } from "zosLoader:./index.page.[pf].layout.js";

const MENU = [
  { label: "Al-Quran",      sub: "القرآن الكريم",  url: "page/gt/quran_nav/index.page",    accent: 0x43A047 },
  { label: "Tasbih",        sub: "التسبيح",         url: "page/gt/tasbih/index.page",       accent: 0x29B6F6 },
  { label: "Jadwal Sholat", sub: "مواقيت الصلاة",   url: "page/gt/prayer_times/index.page", accent: 0xCE93D8 },
  { label: "Arah Kiblat",   sub: "القبلة",          url: "page/gt/qibla/index.page",        accent: 0xFFB74D },
];

const BTN_H    = px(84);
const BTN_GAP  = px(10);
const BTN_Y0   = px(86);
const ACCENT_W = px(5);

Page({
  build() {
    hmUI.setLayerScrolling(false);

    var CX = Math.floor(DEVICE_WIDTH / 2);
    var CY = Math.floor(DEVICE_HEIGHT / 2);

    // Background hijau islami gelap
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: DEVICE_WIDTH, h: DEVICE_HEIGHT,
      color: 0x0a1a14,
    });

    // ── Judul ────────────────────────────────────────────────────────
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(14), w: W, h: px(54),
      text: "القرآن الكريم",
      color: 0xFFD700, text_size: px(28),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Garis ornamen tipis bawah judul
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: PAD + px(20), y: px(70), w: W - px(40), h: 1, color: 0xFFD700, alpha: 45 });
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX,          center_y: px(70), radius: px(3), color: 0xFFD700, alpha: 60 });
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX - px(22), center_y: px(70), radius: px(2), color: 0xFFD700, alpha: 40 });
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX + px(22), center_y: px(70), radius: px(2), color: 0xFFD700, alpha: 40 });

    // ── Pass 1: Background semua tombol ──────────────────────────────
    for (var i = 0; i < MENU.length; i++) {
      var y = BTN_Y0 + i * (BTN_H + BTN_GAP);
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y, w: W, h: BTN_H, color: 0x112211,
      });
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y, w: ACCENT_W, h: BTN_H, color: MENU[i].accent,
      });
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y + BTN_H - 1, w: W, h: 1, color: 0xFFD700, alpha: 30,
      });
    }

    // ── Ornamen islami di atas background, di bawah teks ─────────────
    // Garis silang emas — terlihat di atas button background
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: CX - px(105), y: CY - 1, w: px(210), h: 2, color: 0xFFD700, alpha: 28 });
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: CX - 1, y: CY - px(105), w: 2, h: px(210), color: 0xFFD700, alpha: 28 });

    // Cincin luar: 8 titik oktagram, radius 100, alpha 35
    var R_OUT = px(100);
    for (var d = 0; d < 8; d++) {
      var ang = (d * 45) * Math.PI / 180;
      hmUI.createWidget(hmUI.widget.CIRCLE, {
        center_x: Math.round(CX + R_OUT * Math.sin(ang)),
        center_y: Math.round(CY - R_OUT * Math.cos(ang)),
        radius: px(5), color: 0xFFD700, alpha: 35,
      });
    }
    // Cincin dalam: 8 titik diputar 22.5°, radius 65, alpha 25
    var R_IN = px(65);
    for (var d = 0; d < 8; d++) {
      var ang2 = ((d * 45) + 22.5) * Math.PI / 180;
      hmUI.createWidget(hmUI.widget.CIRCLE, {
        center_x: Math.round(CX + R_IN * Math.sin(ang2)),
        center_y: Math.round(CY - R_IN * Math.cos(ang2)),
        radius: px(3), color: 0xFFD700, alpha: 25,
      });
    }
    // Titik pusat
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX, center_y: CY, radius: px(6), color: 0xFFD700, alpha: 30 });

    // ── Pass 2: Teks + tap area semua tombol ─────────────────────────
    for (var i = 0; i < MENU.length; i++) {
      var m   = MENU[i];
      var y   = BTN_Y0 + i * (BTN_H + BTN_GAP);
      var url = m.url;

      // Label Latin — diperbesar
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + ACCENT_W + px(12), y: y + px(8), w: W - ACCENT_W - px(14), h: px(36),
        text: m.label,
        color: 0xFFFFFF, text_size: px(24),
        align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
      });

      // Sub-label Arab — diperbesar, warna sedikit lebih terang
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + ACCENT_W + px(8), y: y + px(46), w: W - ACCENT_W - px(14), h: px(30),
        text: m.sub,
        color: 0xA0BBA0, text_size: px(20),
        align_h: hmUI.align.RIGHT, align_v: hmUI.align.CENTER_V,
      });

      // Tap area transparan
      var tap = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y, w: W, h: BTN_H, color: 0x000000, alpha: 1,
      });
      tap.addEventListener(hmUI.event.CLICK_UP, (function(u) {
        return function() { push({ url: u }); };
      })(url));
    }
  },
});
