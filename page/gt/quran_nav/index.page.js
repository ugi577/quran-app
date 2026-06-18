import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { push } from "@zos/router";
import { PAD, W } from "zosLoader:./index.page.[pf].layout.js";

const MODES = [
  { label: "Per Surah",   sub: "114 surah",         url: "page/gt/surah_list/index.page" },
  { label: "Per Juz",     sub: "30 juz",             url: "page/gt/juz_list/index.page" },
  { label: "Per Halaman", sub: "604 halaman mushaf", url: "page/gt/page_list/index.page" },
];

const BTN_H   = px(82);
const BTN_GAP = px(10);
const BTN_Y0  = px(95);

Page({
  build() {
    hmUI.setLayerScrolling(false);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(16), w: W, h: px(68),
      text: "القرآن الكريم",
      color: 0xFFD700, text_size: px(30),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    for (var i = 0; i < MODES.length; i++) {
      var m   = MODES[i];
      var y   = BTN_Y0 + i * (BTN_H + BTN_GAP);
      var url = m.url;

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y, w: W, h: BTN_H, color: 0x1a4a2e,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: y + px(12), w: W, h: px(36),
        text: m.label,
        color: 0xFFFFFF, text_size: px(24),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: y + px(48), w: W, h: px(24),
        text: m.sub,
        color: 0x888888, text_size: px(17),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      var tap = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y, w: W, h: BTN_H, color: 0x000000, alpha: 1,
      });
      tap.addEventListener(hmUI.event.CLICK_UP, (function(u) {
        return function() { push({ url: u }); };
      })(url));
    }
  },
});
