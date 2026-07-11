import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { PAD, W } from "zosLoader:./index.page.[pf].layout.js";
import { readAssetJSON } from "../../../utils/index.js";
import * as R from "../../../utils/routes.js";
import * as nav from "../../../utils/nav.js";
import * as T from "../../../utils/theme.js";
import * as ui from "../../../utils/ui.js";

const ITEM_H   = px(72);
const MAX_PAGE = 604;
const GROUP    = 10;

let _h = null;

Page({
  build() {
    nav.enterPage({ right: function () { nav.goBack(); } });

    ui.fillBackground(hmUI);
    hmUI.setLayerScrolling(true);

    var juzList = readAssetJSON("data/juz.json") || [];
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
      color: T.active.gold, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: PAD, y: px(58), w: W, h: px(1), color: T.active.divider,
    });

    var y = px(70);
    var groupNum = 0;

    for (var start = 1; start <= MAX_PAGE; start += GROUP) {
      var end     = Math.min(start + GROUP - 1, MAX_PAGE);
      var itemY   = y;
      var firstPg = start;
      var juzNo   = juzOfPage(start);

      ui.listRow(hmUI, {
        x: PAD, y: itemY, w: W, h: ITEM_H, accent: T.active.gold,
        title: "Hal. " + start + (end > start ? " – " + end : ""),
        meta: "Juz " + juzNo,
        onClick: (function (p) {
          return function () { ui.haptic(); nav.go(R.SURAH_VIEW, p); };
        })(firstPg),
        hidden: true,
        revealDelay: 60 + groupNum * 18,
      });

      y += ITEM_H + px(8);
      groupNum++;
    }
  },

  onDestroy() {
    nav.exitPage(_h);
  },
});
