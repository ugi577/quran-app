import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { PAD, W } from "zosLoader:./index.page.[pf].layout.js";
import * as R from "../../../utils/routes.js";
import * as nav from "../../../utils/nav.js";
import * as T from "../../../utils/theme.js";
import * as ui from "../../../utils/ui.js";
import * as store from "../../../utils/store.js";
import { PRESETS, computeTimes, toHM, getLocation } from "../../../utils/prayer.js";

const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const RING_R = px(74);
const RING_CX = px(233);
const RING_CY = px(152);

let _h = null;
let _tick = null;

function pad2(n) { return (n < 10 ? "0" : "") + n; }

function fmtRemain(minFloat) {
  let total = Math.max(0, Math.floor(minFloat));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return (h > 0 ? h + "j " : "") + m + "m";
}

Page({
  build() {
    nav.enterPage({ right: function () { nav.goBack(); } });
    ui.fillBackground(hmUI);

    const settings = store.settings.get();
    let idx = settings.locationIdx;
    if (typeof idx !== "number" || idx < 0 || idx >= PRESETS.length) idx = 0;
    const loc = getLocation(settings);

    const now = new Date();
    const times = computeTimes(now, loc.lat, loc.lng, loc.tz);

    const prayers = [
      { name: "Subuh",   t: times.fajr },
      { name: "Dzuhur",  t: times.dhuhr },
      { name: "Ashar",   t: times.asr },
      { name: "Maghrib", t: times.maghrib },
      { name: "Isya",    t: times.isha },
    ];
    for (let i = 0; i < prayers.length; i++) {
      const hm = toHM(prayers[i].t);
      prayers[i].hm = hm;
      prayers[i].min = hm.min;
    }

    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    // next & prev prayer
    let nextIdx = -1;
    for (let i = 0; i < prayers.length; i++) {
      if (prayers[i].min > nowMin) { nextIdx = i; break; }
    }
    let nextMin, prevMin;
    if (nextIdx === -1) {
      nextIdx = 0;
      nextMin = prayers[0].min + 1440;
      prevMin = prayers[4].min;
    } else if (nextIdx === 0) {
      nextMin = prayers[0].min;
      prevMin = prayers[4].min - 1440;
    } else {
      nextMin = prayers[nextIdx].min;
      prevMin = prayers[nextIdx - 1].min;
    }
    const remain = nextMin - nowMin;
    const progress = Math.max(0, Math.min(1, (nowMin - prevMin) / (nextMin - prevMin)));

    // Header
    const locText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(12), w: W, h: px(34),
      text: "📍 " + loc.name,
      color: T.active.gold, text_size: px(22),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    ui.tapTarget(hmUI, {
      x: PAD, y: px(10), w: W, h: px(38),
      onClick: function () {
        const s = store.settings.get();
        s.useManual = false;
        s.locationIdx = (idx + 1) % PRESETS.length;
        store.settings.set(s);
        ui.haptic();
        nav.goReplace(R.PRAYER_TIMES);
      },
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(46), w: W, h: px(22),
      text: now.getDate() + " " + BULAN[now.getMonth()] + " " + now.getFullYear(),
      color: T.active.muted, text_size: px(15),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Progress ring (background + fill)
    const boxX = RING_CX - RING_R;
    const boxY = RING_CY - RING_R;
    const boxW = RING_R * 2;
    hmUI.createWidget(hmUI.widget.ARC, {
      x: boxX, y: boxY, w: boxW, h: boxW,
      start_angle: -90, end_angle: 270,
      line_width: px(7), color: T.active.divider,
    });
    hmUI.createWidget(hmUI.widget.ARC, {
      x: boxX, y: boxY, w: boxW, h: boxW,
      start_angle: -90, end_angle: -90,
      line_width: px(7), color: T.active.gold,
    });

    // Countdown center
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: RING_CY - px(34), w: W, h: px(20),
      text: "menuju " + prayers[nextIdx].name,
      color: T.active.muted, text_size: px(14),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    const cdText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: RING_CY - px(12), w: W, h: px(40),
      text: fmtRemain(remain),
      color: T.active.gold, text_size: px(30),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Prayer rows
    const rowY0 = px(248);
    const rowH = px(38);
    for (let i = 0; i < prayers.length; i++) {
      const y = rowY0 + i * rowH;
      const isNext = i === nextIdx;
      const rh = rowH - px(4);
      ui.roundedCard(hmUI, { x: PAD, y, w: W, h: rh, radius: px(14), color: isNext ? T.active.cardHi : T.active.surface });
      hmUI.createWidget(hmUI.widget.CIRCLE, {
        x: PAD + px(14), y: y + Math.floor(rh / 2) - px(6), w: px(12), h: px(12),
        radius: px(6), color: isNext ? T.active.gold : T.active.divider,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + px(34), y: y, w: px(150), h: rh,
        text: prayers[i].name,
        color: isNext ? T.active.gold : T.active.text, text_size: px(20),
        align_h: hmUI.align.LEFT_H, align_v: hmUI.align.CENTER_V,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PAD + px(184), y: y, w: W - px(200), h: rh,
        text: pad2(prayers[i].hm.h) + ":" + pad2(prayers[i].hm.m),
        color: isNext ? T.active.gold : T.active.muted, text_size: px(20),
        align_h: hmUI.align.RIGHT_H, align_v: hmUI.align.CENTER_V,
      });
    }

    // Live countdown
    if (typeof setInterval === "function") {
      _tick = setInterval(function () {
        const t = new Date();
        const nm = t.getHours() * 60 + t.getMinutes() + t.getSeconds() / 60;
        let r = nextMin - nm;
        if (r < 0) r += 1440;
        cdText.setProperty(hmUI.prop.MORE, { text: fmtRemain(r) });
      }, 1000);
    }

    // Entrance: isi ring dari kosong
    ui.animateArc(hmUI, ring, progress, T.active.gold);
  },

  onDestroy() {
    if (_tick && typeof clearInterval === "function") clearInterval(_tick);
    nav.exitPage(_h);
  },
});
