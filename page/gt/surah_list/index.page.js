import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { px } from "@zos/utils";
import { push } from "@zos/router";
import { PAD, W, ITEM_H, HEADER_H } from "zosLoader:./index.page.[pf].layout.js";
import { readAssetJSON } from "../../../utils/index.js";

const logger = Logger.getLogger("surah-list");

Page({
  build() {
    hmUI.setLayerScrolling(true);

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

    var y = HEADER_H;

    for (var i = 0; i < list.length; i++) {
      var s     = list[i];
      var itemY = y;

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: itemY + px(8), w: W - px(30), h: px(40),
        text: s.ar, color: 0xFFFFFF, text_size: px(24),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: itemY + px(52), w: W - px(30), h: px(28),
        text: s.en + "  ·  " + s.a + " ayat  ·  Hal. " + s.p,
        color: 0x666666, text_size: px(17),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      // Ikon › di kanan
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + W - px(28), y: itemY + px(28), w: px(24), h: px(40),
        text: "›", color: 0x888888, text_size: px(26),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      // Garis pemisah
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: itemY + ITEM_H - px(1), w: W, h: px(1), color: 0x2a2a2a,
      });

      // Tap area — CLICK_UP agar tidak terpicu oleh swipe scroll
      var tap = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: itemY, w: W, h: ITEM_H,
        color: 0x000000, alpha: 1,
      });
      tap.addEventListener(hmUI.event.CLICK_UP, (function(p) {
        return function() {
          push({ url: "page/gt/surah_view/index.page", params: String(p) });
        };
      })(s.p));

      y += ITEM_H;
    }
  },

  onDestroy() {
    logger.debug("surah list destroy");
  },
});
