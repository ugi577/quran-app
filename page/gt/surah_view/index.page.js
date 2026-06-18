import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { px } from "@zos/utils";
import { back, replace } from "@zos/router";
import { DEVICE_WIDTH, DEVICE_HEIGHT, PAD, W, LINE_H } from "zosLoader:./index.page.[pf].layout.js";
import { readAssetJSON, toArabicNum } from "../../../utils/index.js";

const logger = Logger.getLogger("surah-view");

const MAX_PAGE = 604;
let _page = 1;

function _pad(n) {
  return (n < 10 ? "00" : n < 100 ? "0" : "") + n;
}

function _estimateAyatH(text) {
  var words = text.trim().split(/\s+/).length;
  var lines = Math.max(1, Math.ceil(words / 7));
  return lines * px(38);
}

Page({
  onInit(params) {
    _page = parseInt(params) || 1;
    if (_page < 1)        _page = 1;
    if (_page > MAX_PAGE) _page = MAX_PAGE;
  },

  build() {
    hmUI.setLayerScrolling(true);

    const entries = readAssetJSON("data/pg/p" + _pad(_page) + ".json");

    if (!entries || entries.length === 0) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: px(200), w: W, h: px(60),
        text: "Gagal memuat Hal. " + _page,
        color: 0xFF4444, text_size: px(22),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      return;
    }

    // ── Header RTL: [← NEXT] [Hal. N · Juz M] [PREV →] ─────────────
    // Mushaf Arab: halaman bertambah ke kiri — tombol kiri = maju, kanan = mundur
    const juz   = entries[0].j;
    const HDR_H = px(52);
    const BTN_W = px(54);

    if (_page < MAX_PAGE) {
      var btnNext = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: 0, w: BTN_W, h: HDR_H,
        text: "←", color: 0xFFD700, text_size: px(28),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      btnNext.addEventListener(hmUI.event.CLICK_UP, function() {
        replace({ url: "page/gt/surah_view/index.page", params: String(_page + 1) });
      });
    }

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD + BTN_W, y: 0, w: W - BTN_W * 2, h: HDR_H,
      text: "Hal. " + _page + "  ·  Juz " + juz,
      color: 0x888888, text_size: px(17),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    if (_page > 1) {
      var btnPrev = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + W - BTN_W, y: 0, w: BTN_W, h: HDR_H,
        text: "→", color: 0xFFD700, text_size: px(28),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      btnPrev.addEventListener(hmUI.event.CLICK_UP, function() {
        replace({ url: "page/gt/surah_view/index.page", params: String(_page - 1) });
      });
    }

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: px(20), y: HDR_H, w: DEVICE_WIDTH - px(40), h: px(1), color: 0x333333,
    });

    // ── Render ayat ──────────────────────────────────────────────────
    var y         = HDR_H + px(10);
    var prevSurah = -1;

    for (var i = 0; i < entries.length; i++) {
      var a = entries[i];

      if (a.s !== prevSurah) {
        if (a.n === 1) {
          if (prevSurah !== -1) y += px(8);
          hmUI.createWidget(hmUI.widget.TEXT, {
            x: PAD, y: y, w: W, h: px(34),
            text: a.ar || "",
            color: 0xFFD700, text_size: px(22),
            align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
          });
          y += px(38);
        }
        prevSurah = a.s;
      }

      var ayatH = _estimateAyatH(a.t);
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: y, w: W, h: ayatH,
        text: a.t + " ﴿" + toArabicNum(a.n) + "﴾",
        color: 0xFFFFFF, text_size: px(24),
        align_h: hmUI.align.RIGHT,
        text_style: hmUI.text_style.WRAP,
      });
      y += ayatH + px(10);
    }

    // ── Footer RTL: [← NEXT] [↩] [PREV →] ──────────────────────────
    y += px(20);
    var FW = Math.floor(W / 3);

    if (_page < MAX_PAGE) {
      var fNext = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: y, w: FW, h: px(48),
        text: "← " + (_page + 1),
        color: 0xFFD700, text_size: px(20),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      fNext.addEventListener(hmUI.event.CLICK_UP, function() {
        replace({ url: "page/gt/surah_view/index.page", params: String(_page + 1) });
      });
    }

    var fHome = hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD + FW, y: y, w: FW, h: px(48),
      text: "↩", color: 0xAAAAAA, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    fHome.addEventListener(hmUI.event.CLICK_UP, function() { back(); });

    if (_page > 1) {
      var fPrev = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + FW * 2, y: y, w: FW, h: px(48),
        text: (_page - 1) + " →",
        color: 0xFFD700, text_size: px(20),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      fPrev.addEventListener(hmUI.event.CLICK_UP, function() {
        replace({ url: "page/gt/surah_view/index.page", params: String(_page - 1) });
      });
    }

    y += px(48) + px(30);

    // ── Sidebar HOME — sisi kiri tengah ──────────────────────────────
    // Strip gelap sepanjang konten; ↩ muncul di tengah layar saat pertama buka.
    // Dibuat TERAKHIR agar berada di atas konten dan dapat menerima tap.
    var SIDE_W = PAD - px(6); // pas di sebelah kiri area konten, tidak tumpang tindih
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: SIDE_W, h: y,
      color: 0x111111, alpha: 110,
    });
    // Ikon ↩ diposisikan di tengah layar (DEVICE_HEIGHT/2) dalam koordinat konten
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: Math.floor(DEVICE_HEIGHT / 2) - px(22), w: SIDE_W, h: px(44),
      text: "↩", color: 0xFFD700, text_size: px(22),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    var homeSide = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: SIDE_W, h: y,
      color: 0x000000, alpha: 1,
    });
    homeSide.addEventListener(hmUI.event.CLICK_UP, function() { back(); });

    // Pixel anchor agar konten bawah tidak terpotong bezel
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: y + px(10), w: 1, h: 1, color: 0x000000,
    });
  },

  onDestroy() {
    logger.debug("page view destroy: " + _page);
  },
});
