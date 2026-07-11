import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import * as nav from "../../../utils/nav.js";
import * as T from "../../../utils/theme.js";
import * as ui from "../../../utils/ui.js";
import * as store from "../../../utils/store.js";
import { PRESETS, qiblaBearing, distanceKm, cardinal, getLocation } from "../../../utils/prayer.js";

const CX = px(233);
const GY = px(200);   // gauge center y
const R = px(105);    // outer ring radius

let _h = null;

Page({
  build() {
    const { width: W } = getDeviceInfo();
    nav.enterPage({ right: function () { nav.goBack(); } });
    hmUI.setLayerScrolling(false);
    ui.fillBackground(hmUI);

    const settings = store.settings.get();
    let idx = settings.locationIdx;
    if (typeof idx !== "number" || idx < 0 || idx >= PRESETS.length) idx = 0;
    const loc = getLocation(settings);

    const brg = qiblaBearing(loc.lat, loc.lng);
    const dist = distanceKm(loc.lat, loc.lng);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(50), y: px(12), w: W - px(100), h: px(30),
      text: "Kiblat",
      color: T.active.gold, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(50), y: px(44), w: W - px(100), h: px(22),
      text: "📍 " + loc.name + "  ·  tap ganti",
      color: T.active.muted, text_size: px(14),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    ui.tapTarget(hmUI, {
      x: px(50), y: px(40), w: W - px(100), h: px(30),
      onClick: function () {
        const s = store.settings.get();
        s.useManual = false;
        s.locationIdx = (idx + 1) % PRESETS.length;
        store.settings.set(s);
        ui.haptic();
        nav.goReplace(R.QIBLA);
      },
    });

    // Compass gauge
    hmUI.createWidget(hmUI.widget.ARC, {
      x: CX - R, y: GY - R, w: R * 2, h: R * 2,
      start_angle: -90, end_angle: 270, line_width: px(3), color: T.active.divider,
    });
    hmUI.createWidget(hmUI.widget.CIRCLE, {
      x: CX - (R - px(8)), y: GY - (R - px(8)), w: (R - px(8)) * 2, h: (R - px(8)) * 2,
      radius: R - px(8), color: T.active.surface,
    });

    // Cardinal marks (N top, E right, S bottom, W left)
    const rim = R - px(18);
    function mark(label, bx, by, isN) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: CX + bx * rim - px(12), y: GY + by * rim - px(11), w: px(24), h: px(22),
        text: label, color: isN ? T.active.gold : T.active.muted,
        text_size: isN ? px(18) : px(15),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
    }
    mark("U", 0, -1, true);   // Utara (top)
    mark("T", 1, 0, false);   // Timur (right)
    mark("S", 0, 1, false);   // Selatan (bottom)
    mark("B", -1, 0, false);  // Barat (left)

    // Qibla direction marker (dot on rim at bearing)
    const rad = (brg * Math.PI) / 180;
    const mx = CX + rim * Math.sin(rad);
    const my = GY - rim * Math.cos(rad);
    hmUI.createWidget(hmUI.widget.CIRCLE, {
      x: mx - px(9), y: my - px(9), w: px(18), h: px(18),
      radius: px(9), color: T.active.emerald,
    });
    // hub
    hmUI.createWidget(hmUI.widget.CIRCLE, {
      x: CX - px(5), y: GY - px(5), w: px(10), h: px(10),
      radius: px(5), color: T.active.gold,
    });

    // Readout
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(50), y: GY + R + px(8), w: W - px(100), h: px(40),
      text: Math.round(brg) + "°",
      color: T.active.gold, text_size: px(36),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: GY + R + px(50), w: W - px(80), h: px(22),
      text: cardinal(brg) + " dari Utara",
      color: T.active.text, text_size: px(16),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: GY + R + px(74), w: W - px(80), h: px(20),
      text: "≈ " + Math.round(dist) + " km ke Ka'bah",
      color: T.active.muted, text_size: px(14),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
  },

  onDestroy() {
    nav.exitPage(_h);
  },
});
