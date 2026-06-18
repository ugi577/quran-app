import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { back } from "@zos/router";
import { getDeviceInfo } from "@zos/device";

Page({
  build() {
    const { width: W, height: H } = getDeviceInfo();
    const CX = Math.floor(W / 2);

    hmUI.setLayerScrolling(false);

    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 0, w: W, h: H, color: 0x0a1a14 });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: px(130), w: W - px(80), h: px(60),
      text: "Tasbih",
      color: 0x29B6F6, text_size: px(30),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: px(200), w: W - px(80), h: px(40),
      text: "التسبيح",
      color: 0xFFD700, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: px(255), w: W - px(80), h: px(40),
      text: "Segera Hadir",
      color: 0x666666, text_size: px(20),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    var btn = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - px(60), y: px(330), w: px(120), h: px(44), color: 0x1a3a28,
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(60), y: px(330), w: px(120), h: px(44),
      text: "↩ Kembali",
      color: 0xFFD700, text_size: px(18),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    var tap = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - px(60), y: px(330), w: px(120), h: px(44), color: 0x000000, alpha: 1,
    });
    tap.addEventListener(hmUI.event.CLICK_UP, function() { back(); });
  },
});
