import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { DEVICE_WIDTH, DEVICE_HEIGHT, PAD, W } from "zosLoader:./index.page.[pf].layout.js";
import * as R from "../../../utils/routes.js";
import * as nav from "../../../utils/nav.js";
import * as T from "../../../utils/theme.js";
import * as ui from "../../../utils/ui.js";

const MENU = [
  { label: "Al-Quran",      sub: "القرآن الكريم",  key: R.QURAN_NAV,    accent: T.ACCENT.quran },
  { label: "Tasbih",        sub: "التسبيح",         key: R.TASBIH,       accent: T.ACCENT.tasbih },
  { label: "Jadwal Sholat", sub: "مواقيت الصلاة",   key: R.PRAYER_TIMES, accent: T.ACCENT.prayer },
  { label: "Arah Kiblat",   sub: "القبلة",          key: R.QIBLA,        accent: T.ACCENT.qibla },
];

let _h = null;

Page({
  build() {
    nav.enterPage({});

    ui.fillBackground(hmUI);
    hmUI.setLayerScrolling(false);

    const CX = Math.floor(DEVICE_WIDTH / 2);

    // ── Ornamen logo tengah (cincin emas / emerald) ──────────────────
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX, center_y: px(96), radius: px(30), color: T.active.gold });
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX, center_y: px(96), radius: px(24), color: T.active.bg });
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX, center_y: px(96), radius: px(12), color: T.active.emerald });
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX, center_y: px(96), radius: px(4),  color: T.active.gold });

    // Logo tengah → Pengaturan
    ui.tapTarget(hmUI, {
      x: CX - px(34), y: px(62), w: px(68), h: px(68),
      onClick: function () { ui.haptic(); nav.go(R.SETTINGS); },
    });

    // Judul
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(136), w: W, h: px(46),
      text: "القرآن الكريم", color: T.active.gold, text_size: px(28),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // ── Grid menu 2×2 (dashboard melingkar) ─────────────────────────
    const GAP    = px(12);
    const COL_W  = Math.floor((W - GAP) / 2);
    const CARD_H = px(96);
    const X0 = PAD;
    const X1 = PAD + COL_W + GAP;
    const Y0 = px(196);
    const Y1 = Y0 + CARD_H + px(12);

    for (let i = 0; i < MENU.length; i++) {
      const m   = MENU[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x   = col === 0 ? X0 : X1;
      const y   = row === 0 ? Y0 : Y1;

      ui.menuItem(hmUI, {
        x, y, w: COL_W, h: CARD_H,
        label: m.label, sub: m.sub, accent: m.accent,
        radius: px(18),
        onClick: (function (k) {
          return function () { ui.haptic(); nav.go(k); };
        })(m.key),
        hidden: true,
        revealDelay: 80 + i * 70,
      });
    }
  },

  onDestroy() {
    nav.exitPage(_h);
  },
});
