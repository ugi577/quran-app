import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { px } from "@zos/utils";
import { DEVICE_WIDTH, PAD, W } from "zosLoader:./index.page.[pf].layout.js";
import { readAssetJSON, toArabicNum } from "../../../utils/index.js";
import * as R from "../../../utils/routes.js";
import * as nav from "../../../utils/nav.js";
import * as T from "../../../utils/theme.js";
import * as ui from "../../../utils/ui.js";
import * as store from "../../../utils/store.js";
import { exportPageToFile } from "../../../utils/export.js";

const logger = Logger.getLogger("surah-view");

const MAX_PAGE = 604;
let _page = 1;
let _h = null;

// Cache parse JSON halaman agar flip tidak mem-parse ulang terus-menerus
const _pageCache = {};
function loadPage(p) {
  if (!_pageCache[p]) _pageCache[p] = readAssetJSON("data/pg/p" + _pad(p) + ".json");
  return _pageCache[p];
}

function _pad(n) {
  return (n < 10 ? "00" : n < 100 ? "0" : "") + n;
}

// Perkiraan tinggi ayat berbasis jumlah karakter (lebih stabil dari kata).
// Sedikit over-estimate agar tidak overlap; ornament ayat di baris sendiri.
function _estimateAyat(text, sizePx) {
  const charW  = sizePx * 0.6;                 // lebar rata-rata glyph Arab
  const perLine = Math.max(1, Math.floor(W / charW));
  const lines = Math.max(1, Math.ceil(text.length / perLine));
  const lineH = Math.round(sizePx * 1.4);
  const textH = lines * lineH;
  const blockH = textH + px(30);               // teks + ornament ayat
  return { textH: textH, blockH: blockH };
}

Page({
  onInit(params) {
    _page = parseInt(params) || 1;
    if (_page < 1)        _page = 1;
    if (_page > MAX_PAGE) _page = MAX_PAGE;
    store.lastPage.set(_page);                 // simpan untuk resume
  },

  build() {
    const flipNext = function () {
      if (_page < MAX_PAGE) { ui.haptic(); nav.goReplace(R.SURAH_VIEW, _page + 1); }
    };
    const flipPrev = function () {
      if (_page > 1) { ui.haptic(); nav.goReplace(R.SURAH_VIEW, _page - 1); }
    };
    // Swipe horizontal: kiri = halaman berikutnya (RTL), kanan = sebelumnya
    nav.enterPage({ left: flipNext, right: flipPrev });

    ui.fillBackground(hmUI);
    hmUI.setLayerScrolling(true);

    const AYAT = Math.max(14, Math.round(24 * T.fontScale()));
    const ORNAMENT = Math.round(AYAT * 0.85);

    const entries = loadPage(_page);

    if (!entries || entries.length === 0) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: px(200), w: W, h: px(60),
        text: "Gagal memuat Hal. " + _page,
        color: T.active.error, text_size: px(22),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      return;
    }

    // ── Header RTL: [← NEXT] [Hal. N · Juz M] [PREV →] ─────────────
    const juz   = entries[0].j;
    const HDR_H = px(52);
    const BTN_W = px(54);

    if (_page < MAX_PAGE) {
      const btnNext = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: 0, w: BTN_W, h: HDR_H,
        text: "←", color: T.active.gold, text_size: px(28),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      btnNext.addEventListener(hmUI.event.CLICK_UP, flipNext);
    }

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD + BTN_W, y: 0, w: W - BTN_W * 3, h: HDR_H,
      text: "Hal. " + _page + "  ·  Juz " + juz,
      color: T.active.muted, text_size: px(17),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    if (_page > 1) {
      const btnPrev = hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + W - BTN_W, y: 0, w: BTN_W, h: HDR_H,
        text: "→", color: T.active.gold, text_size: px(28),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      btnPrev.addEventListener(hmUI.event.CLICK_UP, flipPrev);
    }

    // Ekspor halaman ke berkas .txt
    const btnExport = hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD + W - BTN_W * 2, y: 0, w: BTN_W, h: HDR_H,
        text: "↓", color: T.active.muted, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    btnExport.addEventListener(hmUI.event.CLICK_UP, function () {
      const ok = exportPageToFile(_page, entries);
      try { hmUI.showToast({ text: ok ? "Tersimpan p" + _page : "Gagal ekspor" }); } catch (e) {}
    });

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: px(20), y: HDR_H, w: DEVICE_WIDTH - px(40), h: px(1), color: T.active.divider,
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
            color: T.active.gold, text_size: px(22),
            align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
          });
          y += px(38);
        }
        prevSurah = a.s;
      }

      var dim = _estimateAyat(a.t, AYAT);
      // Teks ayat (RTL, wrap)
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: y, w: W, h: dim.textH,
        text: a.t,
        color: T.active.text, text_size: px(AYAT),
        align_h: hmUI.align.RIGHT,
        text_style: hmUI.text_style.WRAP,
      });
      // Ornamen nomor ayat (emerald) di baris sendiri
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD, y: y + dim.textH + px(2), w: W - px(20), h: px(24),
        text: "﴿" + toArabicNum(a.n) + "﴾",
        color: T.active.emerald, text_size: px(ORNAMENT),
        align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
      });
      y += dim.blockH + px(10);
    }

    // ── Footer: [← next] [☆ bookmark] [↩ home] [→ prev] ───────────
    y += px(20);
    var FW = Math.floor(W / 4);
    var colX = function (c) { return PAD + c * FW; };

    if (_page < MAX_PAGE) {
      var fNext = hmUI.createWidget(hmUI.widget.TEXT, {
        x: colX(0), y: y, w: FW, h: px(48),
        text: "←", color: T.active.gold, text_size: px(26),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      fNext.addEventListener(hmUI.event.CLICK_UP, flipNext);
    }

    var marked = store.bookmarks.has(_page);
    var bm = hmUI.createWidget(hmUI.widget.TEXT, {
      x: colX(1), y: y, w: FW, h: px(48),
      text: marked ? "★" : "☆",
      color: marked ? T.active.gold : T.active.muted, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    bm.addEventListener(hmUI.event.CLICK_UP, function () {
      ui.haptic();
      var nowMarked = store.bookmarks.toggle(_page);
      try { bm.setProperty(hmUI.prop.TEXT, nowMarked ? "★" : "☆"); } catch (e) { /* noop */ }
      try { bm.setProperty(hmUI.prop.COLOR, nowMarked ? T.active.gold : T.active.muted); } catch (e) { /* noop */ }
    });

    var fHome = hmUI.createWidget(hmUI.widget.TEXT, {
      x: colX(2), y: y, w: FW, h: px(48),
      text: "↩", color: T.active.muted, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    fHome.addEventListener(hmUI.event.CLICK_UP, function () { nav.goBack(); });

    if (_page > 1) {
      var fPrev = hmUI.createWidget(hmUI.widget.TEXT, {
        x: colX(3), y: y, w: FW, h: px(48),
        text: "→", color: T.active.gold, text_size: px(26),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      fPrev.addEventListener(hmUI.event.CLICK_UP, flipPrev);
    }

    y += px(48) + px(30);

    // Anchor agar area bawah bisa di-scroll (bezel)
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: y + px(10), w: 1, h: 1, color: T.active.bg,
    });
  },

  onDestroy() {
    nav.exitPage(_h);
    logger.debug("page view destroy: " + _page);
  },
});
