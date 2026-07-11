import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { PAD, W } from "zosLoader:./index.page.[pf].layout.js";
import * as R from "../../../utils/routes.js";
import * as nav from "../../../utils/nav.js";
import * as T from "../../../utils/theme.js";
import * as ui from "../../../utils/ui.js";

const MODES = [
  { label: "Per Surah",   sub: "114 surah",         key: R.SURAH_LIST },
  { label: "Per Juz",     sub: "30 juz",             key: R.JUZ_LIST },
  { label: "Per Halaman", sub: "604 halaman mushaf", key: R.PAGE_LIST },
];

const BTN_H   = px(82);
const BTN_GAP = px(10);
const BTN_Y0  = px(95);

let _h = null;

Page({
  build() {
    nav.enterPage({ right: function () { nav.goBack(); } });

    ui.fillBackground(hmUI);
    hmUI.setLayerScrolling(false);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(16), w: W, h: px(68),
      text: "القرآن الكريم",
      color: T.active.gold, text_size: px(30),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    for (var i = 0; i < MODES.length; i++) {
      var m   = MODES[i];
      var y   = BTN_Y0 + i * (BTN_H + BTN_GAP);
      var url = m.url;

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y, w: W, h: BTN_H, color: T.active.surface,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: y + px(12), w: W, h: px(36),
        text: m.label,
        color: T.active.text, text_size: px(24),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: y + px(48), w: W, h: px(24),
        text: m.sub,
        color: T.active.muted, text_size: px(17),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });

      var tap = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: PAD, y: y, w: W, h: BTN_H, color: 0x000000, alpha: 1,
      });
      tap.addEventListener(hmUI.event.CLICK_UP, (function(k) {
        return function() { nav.go(k); };
      })(m.key));
    }
  },

  onDestroy() {
    nav.exitPage(_h);
  },
});
