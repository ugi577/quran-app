import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { push } from "@zos/router";
import { PAD, W } from "zosLoader:./index.page.[pf].layout.js";
import { readAssetJSON } from "../../../utils/index.js";

const ITEM_H = px(80);

Page({
  build() {
    hmUI.setLayerScrolling(true);

    const juzList = readAssetJSON("data/juz.json");
    if (!juzList) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: px(200), w: W, h: px(60),
        text: "Gagal memuat data juz",
        color: 0xFF4444, text_size: px(20),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      return;
    }

    // Header
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(14), w: W, h: px(42),
      text: "Pilih Juz",
      color: 0xFFD700, text_size: px(26),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: PAD, y: px(58), w: W, h: px(1), color: 0x333333,
    });

    var y = px(65);

    for (var i = 0; i < juzList.length; i++) {
      var juz  = juzList[i];
      var itemY = y;
      var firstPage = juz.p;

      // Nomor juz
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: itemY + px(6), w: W - px(28), h: px(34),
        text: "Juz " + juz.j,
        color: 0xFFD700, text_size: px(22),
        align_h: hmUI.align.LEFT_H, align_v: hmUI.align.CENTER_V,
      });

      // Surah dan range halaman
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: itemY + px(42), w: W - px(28), h: px(26),
        text: juz.en + "  ·  Hal. " + juz.p + " – " + juz.pe,
        color: 0x666666, text_size: px(16),
        align_h: hmUI.align.LEFT_H, align_v: hmUI.align.CENTER_V,
      });

      // Ikon ›
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + W - px(26), y: itemY + px(20), w: px(22), h: px(40),
        text: "›",
        color: 0x888888, text_size: px(24),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      // Garis pemisah
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: itemY + ITEM_H - px(1), w: W, h: px(1), color: 0x2a2a2a,
      });

      // Area tap
      var tap = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: itemY, w: W, h: ITEM_H,
        color: 0x000000, alpha: 1,
      });
      tap.addEventListener(hmUI.event.CLICK_DOWN, (function(p) {
        return function() {
          push({ url: "page/gt/surah_view/index.page", params: String(p) });
        };
      })(firstPage));

      y += ITEM_H;
    }
  },
});
