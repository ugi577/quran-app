import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { px } from "@zos/utils";
import { DEVICE_WIDTH, DEVICE_HEIGHT, PAD, W, ITEM_H, HEADER_H } from "zosLoader:./index.page.[pf].layout.js";
import { readAssetJSON } from "../../../utils/index.js";
import * as R from "../../../utils/routes.js";
import * as nav from "../../../utils/nav.js";
import * as T from "../../../utils/theme.js";
import * as ui from "../../../utils/ui.js";

const logger = Logger.getLogger("surah-list");

let _h = null;
let _filter = "";
let _overlay = null;

Page({
  onInit(params) {
    _filter = params ? String(params) : "";
  },

  build() {
    nav.enterPage({ right: function () { nav.goBack(); } });

    ui.fillBackground(hmUI);
    hmUI.setLayerScrolling(true);

    const list = readAssetJSON("data/index.json");
    if (!list) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: px(200), w: W, h: px(60),
        text: "Gagal memuat data",
        color: T.active.error, text_size: px(22),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      return;
    }

    // ── Search bar (filter abjad) ───────────────────────────────────
    const SB_H = px(44);
    const sbY  = px(14);
    ui.card(hmUI, { x: PAD, y: sbY, w: W, h: SB_H, color: T.active.surface });
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: PAD, y: sbY, w: px(5), h: SB_H, color: T.active.gold });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD + px(16), y: sbY, w: W - px(30), h: SB_H,
      text: "Cari: " + (_filter || "ALL"),
      color: T.active.text, text_size: px(20),
      align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
    });
    ui.tapTarget(hmUI, { x: PAD, y: sbY, w: W, h: SB_H, onClick: openPicker, press: true });

    // ── Daftar surah (terfilter) ────────────────────────────────────
    const data = _filter
      ? list.filter(function (s) { return s.en.toUpperCase().indexOf(_filter) === 0; })
      : list;

    var y = sbY + SB_H + px(10);

    if (data.length === 0) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: y + px(30), w: W, h: px(40),
        text: "Tidak ada hasil", color: T.active.muted, text_size: px(20),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      return;
    }

    for (var i = 0; i < data.length; i++) {
      var s     = data[i];
      var itemY = y;

      ui.card(hmUI, { x: PAD, y: itemY, w: W, h: ITEM_H, color: T.active.surface });
      hmUI.createWidget(hmUI.widget.FILL_RECT, { x: PAD, y: itemY, w: px(5), h: ITEM_H, color: T.active.emerald });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: itemY + px(8), w: W - px(30), h: px(40),
        text: s.ar, color: T.active.gold, text_size: px(24),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: itemY + px(52), w: W - px(30), h: px(28),
        text: s.en + "  ·  " + s.a + " ayat  ·  Hal. " + s.p,
        color: T.active.muted, text_size: px(17),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + W - px(28), y: itemY + px(28), w: px(24), h: px(40),
        text: "›", color: T.active.muted, text_size: px(26),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      ui.tapTarget(hmUI, {
        x: PAD, y: itemY, w: W, h: ITEM_H,
        onClick: (function (p) { return function () { ui.haptic(); nav.go(R.SURAH_VIEW, p); }; })(s.p),
        press: true,
      });

      y += ITEM_H + px(8);
    }

    // ── Picker filter abjad (overlay) ───────────────────────────────
    function openPicker() {
      const ov = [];
      const dim = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0, y: 0, w: DEVICE_WIDTH, h: DEVICE_HEIGHT, color: T.active.bg, alpha: 220,
      });
      ov.push(dim);

      const closeOv = function () {
        ov.forEach(function (w) { try { w.setProperty(hmUI.prop.VISIBLE, false); } catch (e) { /* noop */ } });
        _overlay = null;
      };

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: px(20), w: W, h: px(40),
        text: "Pilih Huruf", color: T.active.gold, text_size: px(22),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      const cols = 5;
      const gw = Math.floor((W - px(20)) / cols);
      const gh = px(40);
      const gx0 = PAD + px(10);
      const gy0 = px(70);

      letters.forEach(function (L, idx) {
        const cx = gx0 + (idx % cols) * gw;
        const cy = gy0 + Math.floor(idx / cols) * (gh + px(6));
        ui.card(hmUI, { x: cx, y: cy, w: gw - px(6), h: gh, color: T.active.surface });
        hmUI.createWidget(hmUI.widget.TEXT, {
          x: cx, y: cy, w: gw - px(6), h: gh, text: L,
          color: T.active.text, text_size: px(20),
          align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
        });
        const t = ui.tapTarget(hmUI, {
          x: cx, y: cy, w: gw - px(6), h: gh,
          onClick: (function (letter) { return function () { nav.goReplace(R.SURAH_LIST, letter); }; })(L),
          press: true,
        });
        ov.push(t.hit);
      });

      // ALL + tutup
      const allY = gy0 + 6 * (gh + px(6)) + px(6);
      ui.card(hmUI, { x: PAD, y: allY, w: W, h: gh, color: T.active.surface });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: allY, w: W, h: gh, text: "Tampilkan Semua",
        color: T.active.gold, text_size: px(20),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      const allTap = ui.tapTarget(hmUI, {
        x: PAD, y: allY, w: W, h: gh,
        onClick: function () { nav.goReplace(R.SURAH_LIST, ""); }, press: true,
      });
      ov.push(allTap.hit);

      ov.push(dim);
      _overlay = ov;
    }
  },

  onDestroy() {
    logger.debug("surah list destroy");
    nav.exitPage(_h);
  },
});
