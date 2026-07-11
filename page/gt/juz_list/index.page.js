import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { PAD, W } from "zosLoader:./index.page.[pf].layout.js";
import { readAssetJSON } from "../../../utils/index.js";
import * as R from "../../../utils/routes.js";
import * as nav from "../../../utils/nav.js";
import * as T from "../../../utils/theme.js";
import * as ui from "../../../utils/ui.js";

const ITEM_H = px(80);

let _h = null;

Page({
  build() {
    nav.enterPage({ right: function () { nav.goBack(); } });

    ui.fillBackground(hmUI);
    hmUI.setLayerScrolling(true);

    const juzList = readAssetJSON("data/juz.json");
    if (!juzList) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: px(200), w: W, h: px(60),
        text: "Gagal memuat data juz",
        color: T.active.error, text_size: px(20),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      return;
    }

    // Header
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(14), w: W, h: px(42),
      text: "Pilih Juz",
      color: T.active.gold, text_size: px(26),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: PAD, y: px(58), w: W, h: px(1), color: T.active.divider,
    });

    var y = px(70);

    for (var i = 0; i < juzList.length; i++) {
      var juz  = juzList[i];
      var itemY = y;
      var firstPage = juz.p;

      ui.listRow(hmUI, {
        x: PAD, y: itemY, w: W, h: ITEM_H, accent: T.active.emerald,
        title: "Juz " + juz.j,
        meta: juz.en + "  ·  Hal. " + juz.p + " – " + juz.pe,
        onClick: (function (p) {
          return function () { ui.haptic(); nav.go(R.SURAH_VIEW, p); };
        })(firstPage),
        hidden: true,
        revealDelay: 60 + i * 35,
      });

      y += ITEM_H + px(8);
    }
  },

  onDestroy() {
    nav.exitPage(_h);
  },
});
