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

const BTN_H    = px(76);
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

    // ── Ornamen geometris islami (di belakang semua konten) ──────────
    // Garis silang emas samar di tengah layar
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: CX-130, y: CY,     w: 260, h: 1, color: 0xFFD700, alpha: 18 });
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: CX,     y: CY-130, w: 1, h: 260, color: 0xFFD700, alpha: 18 });

    // 8 titik oktagram (radius 130px, sudut 45° interval)
    var PTS = [[130,0],[92,92],[0,130],[-92,92],[-130,0],[-92,-92],[0,-130],[92,-92]];
    for (var d = 0; d < PTS.length; d++) {
      hmUI.createWidget(hmUI.widget.CIRCLE, {
        center_x: CX + PTS[d][0], center_y: CY + PTS[d][1],
        radius: px(3), color: 0xFFD700, alpha: 28,
      });
    }
    // Titik pusat
    hmUI.createWidget(hmUI.widget.CIRCLE, {
      center_x: CX, center_y: CY, radius: px(5), color: 0xFFD700, alpha: 28,
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
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX,         center_y: px(70), radius: px(3), color: 0xFFD700, alpha: 60 });
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX - px(22), center_y: px(70), radius: px(2), color: 0xFFD700, alpha: 40 });
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX + px(22), center_y: px(70), radius: px(2), color: 0xFFD700, alpha: 40 });

    // ── 4 Tombol menu ────────────────────────────────────────────────
    for (var i = 0; i < MENU.length; i++) {
      var m   = MENU[i];
      var y   = BTN_Y0 + i * (BTN_H + BTN_GAP);
      var url = m.url;

      // Background tombol
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y, w: W, h: BTN_H, color: 0x112211,
      });

      // Accent strip kiri berwarna
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y, w: ACCENT_W, h: BTN_H, color: m.accent,
      });

      // Border bawah tipis emas
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y + BTN_H - 1, w: W, h: 1, color: 0xFFD700, alpha: 30,
      });

      // Label Latin
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + ACCENT_W + px(12), y: y + px(10), w: W - ACCENT_W - px(14), h: px(34),
        text: m.label,
        color: 0xFFFFFF, text_size: px(22),
        align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
      });

      // Sub-label Arab (rata kanan)
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + ACCENT_W + px(8), y: y + px(44), w: W - ACCENT_W - px(14), h: px(24),
        text: m.sub,
        color: 0x889988, text_size: px(17),
        align_h: hmUI.align.RIGHT, align_v: hmUI.align.CENTER_V,
      });

      // Tap area transparan di atas semua widget baris ini
      var tap = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y, w: W, h: BTN_H, color: 0x000000, alpha: 1,
      });
      tap.addEventListener(hmUI.event.CLICK_UP, (function(u) {
        return function() { push({ url: u }); };
      })(url));
    }
  },
});
