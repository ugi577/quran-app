import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { px } from "@zos/utils";
import { back, replace } from "@zos/router";
import { PAD, W, LINE_H } from "zosLoader:./index.page.[pf].layout.js";
import { readAssetJSON, toArabicNum } from "../../../utils/index.js";

const logger = Logger.getLogger("surah-view");

const MAX_PAGE = 604;
const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

let _page = 1;

function _pad(n) {
  return (n < 10 ? "00" : n < 100 ? "0" : "") + n;
}

function _estimateAyatH(text) {
  var words = text.trim().split(/\s+/).length;
  var lines = Math.max(1, Math.ceil(words / 5));
  return lines * LINE_H + px(8);
}

Page({
  onInit(params) {
    _page = parseInt(params) || 1;
    if (_page < 1) _page = 1;
    if (_page > MAX_PAGE) _page = MAX_PAGE;
  },

  build() {
    // Native scroll — setiap halaman mushaf max ~15 ayat, jarang overflow
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

    // ── Header: [◀] Hal. N · Juz M [▶] ─────────────────────────
    const juz = entries[0].j;
    const HDR_H = px(48);
    const BTN_W = px(50);

    if (_page > 1) {
      const bPrev = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: px(6), w: BTN_W, h: HDR_H - px(12),
        text: "◄", color: 0xFFD700, text_size: px(22),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      bPrev.addEventListener(hmUI.event.CLICK_DOWN, function() {
        replace({ url: "page/gt/surah_view/index.page", params: String(_page - 1) });
      });
    }

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD + BTN_W, y: px(6), w: W - BTN_W * 2, h: HDR_H - px(12),
      text: "Hal. " + _page + "  ·  Juz " + juz,
      color: 0x888888, text_size: px(17),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    if (_page < MAX_PAGE) {
      const bNext = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + W - BTN_W, y: px(6), w: BTN_W, h: HDR_H - px(12),
        text: "►", color: 0xFFD700, text_size: px(22),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      bNext.addEventListener(hmUI.event.CLICK_DOWN, function() {
        replace({ url: "page/gt/surah_view/index.page", params: String(_page + 1) });
      });
    }

    // Garis pemisah header
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: PAD, y: HDR_H - px(2), w: W, h: px(1), color: 0x333333,
    });

    // ── Render ayat ──────────────────────────────────────────────
    let y = HDR_H + px(6);
    let prevSurah = -1;

    for (var i = 0; i < entries.length; i++) {
      var a = entries[i];

      // Nama surah — muncul saat surah berganti di tengah halaman
      if (a.s !== prevSurah) {
        if (prevSurah !== -1) y += px(8);
        hmUI.createWidget(hmUI.widget.TEXT, {
          x: PAD, y: y, w: W, h: px(34),
          text: a.ar || "",
          color: 0xFFD700, text_size: px(22),
          align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
        });
        y += px(34);
        prevSurah = a.s;
      }

      // Bismillah terpisah untuk ayat n=1 (kecuali s001 = Fatihah, s009 = At-Taubah)
      var displayText = a.t;
      if (a.n === 1 && a.s !== 1 && a.s !== 9 && a.t.indexOf(BASMALA) === 0) {
        hmUI.createWidget(hmUI.widget.TEXT, {
          x: PAD, y: y, w: W, h: LINE_H + px(8),
          text: BASMALA,
          color: 0xFFD700, text_size: px(22),
          align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
        });
        y += LINE_H + px(8) + px(14);
        displayText = a.t.slice(BASMALA.length);
        // Hapus spasi di awal
        var k = 0;
        while (k < displayText.length && displayText.charCodeAt(k) <= 32) k++;
        if (k > 0) displayText = displayText.slice(k);
      }

      var ayatH = _estimateAyatH(displayText);
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: y, w: W, h: ayatH,
        text: displayText + " ﴿" + toArabicNum(a.n) + "﴾",
        color: 0xFFFFFF, text_size: px(24),
        align_h: hmUI.align.CENTER_H,
        text_style: hmUI.text_style.WRAP,
      });
      y += ayatH + px(10);
    }

    // ── Footer: [◀] [↩] [▶] ─────────────────────────────────────
    y += px(10);
    var FOOT_W = Math.floor(W / 3);

    if (_page > 1) {
      var fPrev = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: y, w: FOOT_W, h: px(44),
        text: "◄ " + (_page - 1),
        color: 0xFFD700, text_size: px(20),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      fPrev.addEventListener(hmUI.event.CLICK_DOWN, function() {
        replace({ url: "page/gt/surah_view/index.page", params: String(_page - 1) });
      });
    }

    var fBack = hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD + FOOT_W, y: y, w: FOOT_W, h: px(44),
      text: "↩",
      color: 0xAAAAAA, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    fBack.addEventListener(hmUI.event.CLICK_DOWN, function() {
      back();
    });

    if (_page < MAX_PAGE) {
      var fNext = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + FOOT_W * 2, y: y, w: FOOT_W, h: px(44),
        text: (_page + 1) + " ►",
        color: 0xFFD700, text_size: px(20),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      fNext.addEventListener(hmUI.event.CLICK_DOWN, function() {
        replace({ url: "page/gt/surah_view/index.page", params: String(_page + 1) });
      });
    }
  },

  onDestroy() {
    logger.debug("page view destroy: " + _page);
  },
});
