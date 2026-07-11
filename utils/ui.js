// Pustaka UI bersama — Quran App
//
// Factory untuk widget agar seluruh page konsisten (warna, tap target,
// umpan balik tekan, kartu). Mengurangi duplikasi dan memusatkan desain.
//
// Konvensi: setiap helper menerima `hmUI` (namespace @zos/ui) sebagai argumen
// pertama, persis seperti Page.build() memanggil createWidget.

import { px } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { Vibrator } from "@zos/sensor";
import * as T from "./theme.js";

let _vib = null;

// Umpan balik haptik singkat (aman jika motor tak tersedia)
export function haptic() {
  try {
    if (!_vib) _vib = new Vibrator();
    _vib.start();
  } catch (e) { /* noop */ }
}

// Animasi isi ARC dari kosong ke frac (0..1) — mikro-interaksi pembuka
export function animateArc(hmUI, widget, toFrac, color, dur = 450) {
  const steps = 10;
  let i = 0;
  const tick = function () {
    i += 1;
    const f = Math.max(0, Math.min(1, (toFrac * i) / steps));
    try { widget.setProperty(hmUI.prop.MORE, { end_angle: -90 + 360 * f, color }); } catch (e) { /* noop */ }
    if (i < steps) setTimeout(tick, dur / steps);
  };
  tick();
}

// Latar layar penuh (pure black secara default)
export function fillBackground(hmUI, color = T.active.bg) {
  const { width, height } = getDeviceInfo();
  hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 0, w: width, h: height, color });
}

// Judul layar (emas, rata tengah)
export function screenTitle(hmUI, text, opts = {}) {
  const { y = px(16), size = px(28), color = T.active.gold, pad = T.PAD_DEFAULT() } = opts;
  const { width } = getDeviceInfo();
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: pad, y, w: width - pad * 2, h: px(46),
    text, color, text_size: size,
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
  });
}

// Kartu permukaan (FILL_RECT). Pembulatan sudut menyusul di fase akhir.
export function card(hmUI, opts) {
  const { x, y, w, h, color = T.active.surface } = opts;
  return hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color });
}

// Target sentuh transparan dengan umpan balik tekan opsional.
// press=true menampilkan highlight saat CLICK_DOWN — hindari di list panjang
// (menambah 1 widget per item). Tap selalu memanggil onClick pada CLICK_UP.
// hidden=true menyembunyikan widget (untuk entrance animation).
export function tapTarget(hmUI, opts) {
  const { x, y, w, h, onClick, press = false, highlightColor = T.active.press, hidden = false } = opts;

  let hi = null;
  if (press) {
    hi = hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color: highlightColor, alpha: 50 });
    if (hmUI.prop && hmUI.prop.VISIBLE !== undefined) {
      hi.setProperty(hmUI.prop.VISIBLE, false);
    }
  }

  const hit = hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color: 0x000000, alpha: 1 });

  if (hi) {
    hit.addEventListener(hmUI.event.CLICK_DOWN, function () {
      hi.setProperty(hmUI.prop.VISIBLE, true);
    });
  }
  hit.addEventListener(hmUI.event.CLICK_UP, function () {
    if (hi) hi.setProperty(hmUI.prop.VISIBLE, false);
    if (onClick) onClick();
  });

  if (hidden) hit.setProperty(hmUI.prop.VISIBLE, false);

  return { hit, hi, widgets: [hit] };
}

// Kartu berbentuk BUTTON (mendukung radius) — sudut membulat nyata.
// BUTTON menangani tap sendiri (click_func), sehingga tidak perlu tapTarget.
export function roundedCard(hmUI, opts) {
  const {
    x, y, w, h, radius = px(16), color = T.active.surface,
    pressColor = T.active.cardHi, onClick,
  } = opts;
  return hmUI.createWidget(hmUI.widget.BUTTON, {
    x, y, w, h, radius,
    normal_color: color,
    press_color: pressColor,
    click_func: onClick || function () {},
  });
}

// Item menu: kartu + label + sub (Arab rata kanan) + aksen + tap.
// Jika radius diberi -> kartu membulat (BUTTON), aksen berupa dot.
// Jika tidak -> kartu persegi (FILL_RECT) + strip + tapTarget (list panjang).
// hidden + revealDelay: di-pop bertahap saat masuk (entrance).
export function menuItem(hmUI, opts) {
  const {
    x, y, w, h, label, sub = "", accent = T.active.emerald,
    pad = T.PAD_DEFAULT(), onClick, press = true, hidden = false, revealDelay = null,
    radius = null, chevron = false, value = null,
  } = opts;

  const reveal = [];
  let hit = null;

  if (radius) {
    const btn = roundedCard(hmUI, { x, y, w, h, radius, onClick });
    reveal.push(btn);
    hit = btn;
    // Dot aksen kiri
    reveal.push(hmUI.createWidget(hmUI.widget.CIRCLE, {
      x: x + px(14), y: y + Math.floor(h / 2) - px(6), w: px(12), h: px(12),
      radius: px(6), color: accent,
    }));
    const tx = x + px(34);
    const tw = w - px(44) - (chevron ? px(24) : 0) - (value ? px(90) : 0);
    reveal.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: tx, y: y + px(10), w: tw, h: px(34),
      text: label, color: T.active.text, text_size: px(22),
      align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
    }));
    if (sub) {
      reveal.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: tx, y: y + px(44), w: tw, h: px(24),
        text: sub, color: T.active.muted, text_size: px(17),
        align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
      }));
    }
    if (chevron) {
      reveal.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: x + w - px(26), y: y, w: px(22), h: h,
        text: "›", color: T.active.muted, text_size: px(24),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      }));
    }
    if (value) {
      reveal.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: x + w - px(110), y: y, w: px(90), h: h,
        text: value, color: T.active.gold, text_size: px(18),
        align_h: hmUI.align.RIGHT_H, align_v: hmUI.align.CENTER_V,
      }));
    }
  } else {
    const c = card(hmUI, { x, y, w, h, color: T.active.surface });
    reveal.push(c);
    const strip = hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w: px(5), h, color: accent });
    reveal.push(strip);
    reveal.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x + px(17), y: y + px(10), w: w - px(20), h: px(34),
      text: label, color: T.active.text, text_size: px(22),
      align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
    }));
    if (sub) {
      reveal.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: x + px(13), y: y + px(44), w: w - px(20), h: px(24),
        text: sub, color: T.active.muted, text_size: px(17),
        align_h: hmUI.align.RIGHT, align_v: hmUI.align.CENTER_V,
      }));
    }
    const tap = tapTarget(hmUI, { x, y, w, h, onClick, press, hidden });
    tap.widgets.forEach(function (w) { reveal.push(w); });
    hit = tap.hit;
  }

  if (hidden) {
    reveal.forEach(function (w) {
      try { w.setProperty(hmUI.prop.VISIBLE, false); } catch (e) { /* noop */ }
    });
    setTimeout(function () {
      reveal.forEach(function (w) {
        try { w.setProperty(hmUI.prop.VISIBLE, true); } catch (e) { /* widget mungkin sudah dibuang */ }
      });
    }, revealDelay == null ? 0 : revealDelay);
  }

  return { reveal, hit: hit };
}

// Pengukur layar (berguna untuk layout radial / lingkaran)
export function device() {
  return getDeviceInfo();
}

// Baris list: kartu + strip aksen + judul (emas) + meta (muted) + chevron + tap.
// hidden + revealDelay: baris di-pop bertahap saat masuk (entrance premium).
export function listRow(hmUI, opts) {
  const {
    x, y, w, h, title, meta = "", accent = T.active.emerald,
    chevron = true, onClick, press = true, hidden = false, revealDelay = null,
  } = opts;

  const reveal = [];
  reveal.push(card(hmUI, { x, y, w, h, color: T.active.surface }));
  reveal.push(hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w: px(5), h, color: accent }));
  reveal.push(hmUI.createWidget(hmUI.widget.TEXT, {
    x: x + px(16), y: y + px(6), w: w - px(40), h: px(34),
    text: title, color: T.active.gold, text_size: px(22),
    align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
  }));
  reveal.push(hmUI.createWidget(hmUI.widget.TEXT, {
    x: x + px(16), y: y + px(42), w: w - px(40), h: px(26),
    text: meta, color: T.active.muted, text_size: px(16),
    align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
  }));
  if (chevron) {
    reveal.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x + w - px(26), y: y + px(20), w: px(22), h: px(40),
      text: "›", color: T.active.muted, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    }));
  }
  const tap = tapTarget(hmUI, { x, y, w, h, onClick, press, hidden });
  tap.widgets.forEach(function (w) { reveal.push(w); });

  if (hidden) {
    reveal.forEach(function (w) { try { w.setProperty(hmUI.prop.VISIBLE, false); } catch (e) { /* noop */ } });
    setTimeout(function () {
      reveal.forEach(function (w) { try { w.setProperty(hmUI.prop.VISIBLE, true); } catch (e) { /* noop */ } });
    }, revealDelay == null ? 0 : revealDelay);
  }
  return { reveal, hit: tap.hit };
}

export default { fillBackground, screenTitle, card, tapTarget, menuItem, device, haptic, animateArc, listRow, roundedCard };
