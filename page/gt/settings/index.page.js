import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { PAD, W } from "zosLoader:./index.page.[pf].layout.js";
import * as R from "../../../utils/routes.js";
import * as nav from "../../../utils/nav.js";
import * as T from "../../../utils/theme.js";
import * as ui from "../../../utils/ui.js";
import * as store from "../../../utils/store.js";
import { PRESETS, getLocation } from "../../../utils/prayer.js";

const FONT_LABELS = ["Kecil", "Sedang", "Besar"];
const THEME_LABELS = { dark: "Emas", hijau: "Hijau" };
const VERSION = "Quran App v1.0.1";

const RH = px(58);
const GAP = px(10);

let _h = null;

Page({
  build() {
    nav.enterPage({ right: function () { nav.goBack(); } });
    ui.fillBackground(hmUI);
    hmUI.setLayerScrolling(true);

    const s0 = store.settings.get();
    const loc = getLocation(s0);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(12), w: W, h: px(34),
      text: "Pengaturan",
      color: T.active.gold, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: PAD, y: px(50), w: W, h: px(1), color: T.active.divider,
    });

    function row(y, label, value, onClick) {
      ui.roundedCard(hmUI, { x: PAD, y: y, w: W, h: RH, radius: px(16), onClick: onClick });
      hmUI.createWidget(hmUI.widget.CIRCLE, {
        x: PAD + px(14), y: y + Math.floor(RH / 2) - px(6), w: px(12), h: px(12),
        radius: px(6), color: T.active.emerald,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + px(34), y: y, w: px(170), h: RH,
        text: label, color: T.active.text, text_size: px(19),
        align_h: hmUI.align.LEFT_H, align_v: hmUI.align.CENTER_V,
      });
      const v = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + px(200), y: y, w: W - px(200) - px(30), h: RH,
        text: value, color: T.active.gold, text_size: px(18),
        align_h: hmUI.align.RIGHT_H, align_v: hmUI.align.CENTER_V,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + W - px(22), y: y, w: px(18), h: RH,
        text: "›", color: T.active.muted, text_size: px(22),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      return v;
    }

    let y = px(64);
    var valTheme = null, valFont = null, valLoc = null;

    // Warna tema
    valTheme = row(y, "Warna Tema", THEME_LABELS[s0.theme || "dark"], function () {
      ui.haptic();
      const s = store.settings.get();
      const next = s.theme === "hijau" ? "dark" : "hijau";
      T.setVariant(next);
      valTheme.setProperty(hmUI.prop.MORE, { text: THEME_LABELS[next] });
    });
    y += RH + GAP;

    // Ukuran huruf
    valFont = row(y, "Ukuran Huruf", FONT_LABELS[(typeof s0.font === "number" ? s0.font : 1)], function () {
      ui.haptic();
      const s = store.settings.get();
      const cur = typeof s.font === "number" ? s.font : 1;
      const next = (cur + 1) % 3;
      s.font = next;
      store.settings.set(s);
      valFont.setProperty(hmUI.prop.MORE, { text: FONT_LABELS[next] });
    });
    y += RH + GAP;

    // Lokasi (preset)
    valLoc = row(y, "Lokasi", loc.name, function () {
      ui.haptic();
      const s = store.settings.get();
      s.useManual = false;
      let idx = typeof s.locationIdx === "number" ? s.locationIdx : 0;
      idx = (idx + 1) % PRESETS.length;
      s.locationIdx = idx;
      store.settings.set(s);
      valLoc.setProperty(hmUI.prop.MORE, { text: PRESETS[idx].name });
    });
    y += RH + GAP;

    // Koordinat manual
    row(y, "Koordinat Manual", s0.useManual ? "Aktif" : "Atur", function () {
      nav.go(R.SETTINGS_LOC);
    });
    y += RH + GAP;

    // Tentang
    row(y, "Tentang", VERSION, function () {
      try { hmUI.showToast({ text: VERSION }); } catch (e) { /* noop */ }
    });
  },

  onDestroy() {
    nav.exitPage(_h);
  },
});
