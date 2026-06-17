import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { push } from "@zos/router";
import { PAD, W } from "zosLoader:./index.page.[pf].layout.js";
import { readAssetJSON } from "../../../utils/index.js";

// Tampilkan 604 halaman dalam 61 grup × 10 halaman
// Tap grup → buka halaman mushaf pertama di grup itu
const ITEM_H   = px(72);
const MAX_PAGE = 604;
const GROUP    = 10;

Page({
  build() {
    hmUI.setLayerScrolling(true);

    // Muat juz.json untuk menampilkan info juz di setiap grup
    var juzList = readAssetJSON("data/juz.json") || [];
    // Buat lookup: halaman → juz
    function juzOfPage(page) {
      for (var i = juzList.length - 1; i >= 0; i--) {
        if (juzList[i].p <= page) return juzList[i].j;
      }
      return 1;
    }

    // Header
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(14), w: W, h: px(42),
      text: "Pilih Halaman",
      color: 0xFFD700, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: PAD, y: px(58), w: W, h: px(1), color: 0x333333,
    });

    var y = px(65);
    var groupNum = 0;

    for (var start = 1; start <= MAX_PAGE; start += GROUP) {
      var end     = Math.min(start + GROUP - 1, MAX_PAGE);
      var itemY   = y;
      var firstPg = start;
      var juzNo   = juzOfPage(start);

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: itemY + px(6), w: W - px(28), h: px(32),
        text: "Hal. " + start + (end > start ? " – " + end : ""),
        color: 0xFFFFFF, text_size: px(22),
        align_h: hmUI.align.LEFT_H, align_v: hmUI.align.CENTER_V,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: itemY + px(40), w: W - px(28), h: px(24),
        text: "Juz " + juzNo,
        color: 0x666666, text_size: px(16),
        align_h: hmUI.align.LEFT_H, align_v: hmUI.align.CENTER_V,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + W - px(26), y: itemY + px(18), w: px(22), h: px(36),
        text: "›",
        color: 0x888888, text_size: px(24),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: itemY + ITEM_H - px(1), w: W, h: px(1), color: 0x2a2a2a,
      });

      var tap = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: itemY, w: W, h: ITEM_H,
        color: 0x000000, alpha: 1,
      });
      tap.addEventListener(hmUI.event.CLICK_DOWN, (function(p) {
        return function() {
          push({ url: "page/gt/surah_view/index.page", params: String(p) });
        };
      })(firstPg));

      y += ITEM_H;
      groupNum++;
    }
  },
});
