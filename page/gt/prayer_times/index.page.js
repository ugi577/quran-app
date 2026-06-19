import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { back } from "@zos/router";
import { getDeviceInfo } from "@zos/device";
import { Time } from "@zos/sensor";
import { calcPrayerTimes, nextPrayerIndex } from "../../../utils/prayer_calc.js";
import { getLocation } from "../../../utils/location.js";

var NAMES = ["Fajr", "Terbit", "Dzuhur", "Ashar", "Maghrib", "Isya"];
var KEYS  = ["fajr", "sunrise", "dhuhr", "asar", "maghrib", "isha"];

var wStatus   = null;
var wLocLabel = null;
var wRows     = [];  // [{wName, wTime}]
var isLoading = false;

function getNow() {
  try {
    var t = new Time();
    return { year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate(),
             nowMins: t.getHours() * 60 + t.getMinutes() };
  } catch (e) {
    var d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
             nowMins: d.getHours() * 60 + d.getMinutes() };
  }
}

function timezoneFromLng(lng) {
  // Rough WIB/WITA/WIT split for Indonesia; default WIB=7 elsewhere
  if (lng >= 115 && lng < 120) return 8; // Bali/WITA est.
  if (lng >= 120) return 9;              // WIT
  if (lng >= 95)  return 7;             // WIB
  return Math.round(lng / 15);
}

function setStatus(text) {
  if (wStatus) wStatus.setProperty(hmUI.prop.MORE, { text: text });
}

function setLocLabel(text) {
  if (wLocLabel) wLocLabel.setProperty(hmUI.prop.MORE, { text: text });
}

function renderTimes(times, nextIdx) {
  for (var i = 0; i < KEYS.length; i++) {
    var isNext = (i === nextIdx);
    if (wRows[i]) {
      wRows[i].wName.setProperty(hmUI.prop.MORE, {
        color: isNext ? 0xFFD700 : 0xCCCCCC,
      });
      wRows[i].wTime.setProperty(hmUI.prop.MORE, {
        text:  times[KEYS[i]],
        color: isNext ? 0xFFD700 : 0xFFFFFF,
      });
    }
  }
  setStatus("");
}

function doLoad() {
  if (isLoading) return;
  isLoading = true;
  setStatus("Mencari lokasi...");
  setLocLabel("--");
  // Clear all times
  for (var i = 0; i < KEYS.length; i++) {
    if (wRows[i]) {
      wRows[i].wTime.setProperty(hmUI.prop.MORE, { text: "--:--", color: 0x555555 });
      wRows[i].wName.setProperty(hmUI.prop.MORE, { color: 0x888888 });
    }
  }

  getLocation(
    function(loc) {
      isLoading = false;
      var now = getNow();
      var tz  = timezoneFromLng(loc.lng);
      var times = calcPrayerTimes(loc.lat, loc.lng, now, tz);
      var nextIdx = nextPrayerIndex(times, now.nowMins);
      var srcLabel = loc.source === "GPS" ? "GPS" : "Cache";
      setLocLabel(srcLabel + "  " + loc.lat.toFixed(2) + "," + loc.lng.toFixed(2));
      renderTimes(times, nextIdx);
    },
    function(errMsg) {
      isLoading = false;
      setStatus(errMsg);
      setLocLabel("--");
    }
  );
}

Page({
  build() {
    const { width: W, height: H } = getDeviceInfo();
    const CX = Math.floor(W / 2);
    const CY = Math.floor(H / 2);

    hmUI.setLayerScrolling(false);

    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 0, w: W, h: H, color: 0x0a1a14 });

    // Title
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(50), y: px(12), w: W - px(100), h: px(40),
      text: "Jadwal Sholat", color: 0xCE93D8, text_size: px(22),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Location + source indicator
    wLocLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(50), y: px(54), w: W - px(100), h: px(28),
      text: "--", color: 0x888888, text_size: px(14),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Divider
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: px(60), y: px(84), w: W - px(120), h: 1, color: 0xCE93D8, alpha: 35,
    });

    // Prayer rows — 6 items, each 46px tall
    var ROW_H  = px(46);
    var ROW_Y0 = px(92);
    wRows = [];
    for (var i = 0; i < KEYS.length; i++) {
      var ry = ROW_Y0 + i * ROW_H;
      var bg = (i % 2 === 0) ? 0x0d1f17 : 0x0a1a14;
      hmUI.createWidget(hmUI.widget.FILL_RECT, { x: px(38), y: ry, w: W - px(76), h: ROW_H, color: bg });

      var wn = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(48), y: ry, w: px(130), h: ROW_H,
        text: NAMES[i], color: 0x888888, text_size: px(18),
        align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
      });
      var wt = hmUI.createWidget(hmUI.widget.TEXT, {
        x: W - px(148), y: ry, w: px(110), h: ROW_H,
        text: "--:--", color: 0x555555, text_size: px(20),
        align_h: hmUI.align.RIGHT, align_v: hmUI.align.CENTER_V,
      });
      wRows.push({ wName: wn, wTime: wt });
    }

    // Status / error text (below rows)
    var rowsBottom = ROW_Y0 + 6 * ROW_H + px(8);
    wStatus = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: rowsBottom, w: W - px(80), h: px(34),
      text: "", color: 0xFF9800, text_size: px(14),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Refresh button
    var refreshY = rowsBottom + px(36);
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: CX - px(50), y: refreshY, w: px(100), h: px(38), color: 0x1a3322 });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(50), y: refreshY, w: px(100), h: px(38),
      text: "↺ Refresh", color: 0xCE93D8, text_size: px(16),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    var tapRefresh = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: CX - px(50), y: refreshY, w: px(100), h: px(38), color: 0x000000, alpha: 1 });
    tapRefresh.addEventListener(hmUI.event.CLICK_UP, function() { doLoad(); });

    // Sidebar ←
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: CY - px(46), w: px(32), h: px(92), color: 0x1a3322 });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: CY - px(46), w: px(32), h: px(92),
      text: "←", color: 0xFFD700, text_size: px(20),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    var tapHome = hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: CY - px(46), w: px(32), h: px(92), color: 0x000000, alpha: 1 });
    tapHome.addEventListener(hmUI.event.CLICK_UP, function() { back(); });

    doLoad();
  },

  onResume() {
    doLoad();
  },
});
