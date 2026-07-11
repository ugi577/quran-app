import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { PAD, W } from "zosLoader:./index.page.[pf].layout.js";
import * as nav from "../../../utils/nav.js";
import * as T from "../../../utils/theme.js";
import * as ui from "../../../utils/ui.js";
import * as store from "../../../utils/store.js";
import { PRESETS } from "../../../utils/prayer.js";

const RH = px(64);

let _h = null;

Page({
  build() {
    nav.enterPage({ right: function () { nav.goBack(); } });
    ui.fillBackground(hmUI);
    hmUI.setLayerScrolling(true);

    const s = store.settings.get();
    const base = (s.useManual && s.manual) ? s.manual : PRESETS[0];
    const cur = {
      lat: typeof base.lat === "number" ? base.lat : 0,
      lng: typeof base.lng === "number" ? base.lng : 0,
      tz: typeof base.tz === "number" ? base.tz : 7,
    };

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(12), w: W, h: px(34),
      text: "Koordinat Manual",
      color: T.active.gold, text_size: px(22),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

    function stepper(y, label, getv, setv, step, lo, hi, fmt) {
      ui.card(hmUI, { x: PAD, y: y, w: W, h: RH, color: T.active.surface });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + px(16), y: y, w: px(150), h: RH,
        text: label, color: T.active.text, text_size: px(18),
        align_h: hmUI.align.LEFT_H, align_v: hmUI.align.CENTER_V,
      });
      const val = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + px(150), y: y, w: W - px(150) - px(120), h: RH,
        text: fmt(getv()), color: T.active.gold, text_size: px(19),
        align_h: hmUI.align.RIGHT_H, align_v: hmUI.align.CENTER_V,
      });
      function btn(x, sign) {
        hmUI.createWidget(hmUI.widget.BUTTON, {
          x: x, y: y + px(10), w: px(44), h: px(44), radius: px(10),
          normal_color: T.active.cardHi, press_color: T.active.press,
          text: sign > 0 ? "+" : "−",
          click_func: function () {
            setv(clamp(getv() + sign * step, lo, hi));
            val.setProperty(hmUI.prop.MORE, { text: fmt(getv()) });
          },
        });
      }
      btn(PAD + W - px(104), -1);
      btn(PAD + W - px(52), 1);
    }

    let y = px(70);
    stepper(y, "Lintang", function () { return cur.lat; }, function (v) { cur.lat = v; }, 0.1, -90, 90, function (v) { return v.toFixed(1) + "°"; });
    y += RH + px(10);
    stepper(y, "Bujur", function () { return cur.lng; }, function (v) { cur.lng = v; }, 0.1, -180, 180, function (v) { return v.toFixed(1) + "°"; });
    y += RH + px(10);
    stepper(y, "Zona Waktu", function () { return cur.tz; }, function (v) { cur.tz = v; }, 0.5, -12, 14, function (v) { return "UTC" + (v >= 0 ? "+" : "") + v; });
    y += RH + px(18);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: y, w: W, h: px(34),
      text: "Tap − / + lalu Simpan",
      color: T.active.muted, text_size: px(14),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Simpan
    const sy = y + px(42);
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: PAD, y: sy, w: W, h: px(54), radius: px(12),
      normal_color: T.active.emerald, press_color: T.active.press,
      text: "Simpan",
      click_func: function () {
        const st = store.settings.get();
        st.manual = { name: "Manual", lat: cur.lat, lng: cur.lng, tz: cur.tz };
        st.useManual = true;
        store.settings.set(st);
        nav.goBack();
      },
    });
  },

  onDestroy() {
    nav.exitPage(_h);
  },
});
