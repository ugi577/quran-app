import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { Vibrator } from "@zos/sensor";
import * as nav from "../../../utils/nav.js";
import * as T from "../../../utils/theme.js";
import * as ui from "../../../utils/ui.js";
import * as store from "../../../utils/store.js";

const DHIKR = [
  { ar: "سُبْحَانَ اللَّهِ", la: "Subhanallah" },
  { ar: "الْحَمْدُ لِلَّهِ", la: "Alhamdulillah" },
  { ar: "اللَّهُ أَكْبَرُ", la: "Allahu Akbar" },
  { ar: "لَا إِلَٰهَ إِلَّا اللَّهُ", la: "Lâ ilâha illallâh" },
];
const TARGETS = [33, 99, 100];

const PAD = px(50);
const CX = px(233);
const RING_R = px(100);
const RING_CY = px(218);
const BTN_R = px(88);

let _h = null;
let _vib = null;

function pad3(n) { return (n < 10 ? "00" : n < 100 ? "0" : "") + n; }

function todayStr() {
  const d = new Date();
  const p = (n) => (n < 10 ? "0" : "") + n;
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

Page({
  build() {
    const { width: W } = getDeviceInfo();
    nav.enterPage({ right: function () { nav.goBack(); } });
    hmUI.setLayerScrolling(false);

    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 0, w: W, h: px(466), color: T.active.bg });

    const st = store.tasbih.get();
    const s = {
      count: typeof st.count === "number" ? st.count : 0,
      targetIdx: typeof st.targetIdx === "number" ? st.targetIdx : 0,
      dhikrIdx: typeof st.dhikrIdx === "number" ? st.dhikrIdx : 0,
      total: typeof st.total === "number" ? st.total : 0,
      sessions: Array.isArray(st.sessions) ? st.sessions : [],
      reached: false,
    };
    s.reached = s.count >= TARGETS[s.targetIdx];
    const target = TARGETS[s.targetIdx];

    try { _vib = new Vibrator(); } catch (e) { _vib = null; }

    // Header
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(12), w: W - PAD * 2, h: px(30),
      text: "Tasbih",
      color: T.active.gold, text_size: px(24),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    // Dhikr (tappable to cycle)
    const arText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(48), w: W - PAD * 2, h: px(30),
      text: DHIKR[s.dhikrIdx].ar,
      color: T.active.gold, text_size: px(20),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    const laText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: px(80), w: W - PAD * 2, h: px(22),
      text: DHIKR[s.dhikrIdx].la,
      color: T.active.muted, text_size: px(15),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    ui.tapTarget(hmUI, {
      x: PAD, y: px(44), w: W - PAD * 2, h: px(62),
      onClick: function () {
        s.dhikrIdx = (s.dhikrIdx + 1) % DHIKR.length;
        arText.setProperty(hmUI.prop.MORE, { text: DHIKR[s.dhikrIdx].ar });
        laText.setProperty(hmUI.prop.MORE, { text: DHIKR[s.dhikrIdx].la });
        _save(s);
      },
    });

    // Progress ring (background + fill)
    const boxX = CX - RING_R, boxY = RING_CY - RING_R, boxW = RING_R * 2;
    hmUI.createWidget(hmUI.widget.ARC, {
      x: boxX, y: boxY, w: boxW, h: boxW,
      start_angle: -90, end_angle: 270, line_width: px(8), color: T.active.divider,
    });
    const ring = hmUI.createWidget(hmUI.widget.ARC, {
      x: boxX, y: boxY, w: boxW, h: boxW,
      start_angle: -90, end_angle: -90, line_width: px(8), color: T.active.gold,
    });

    // Big tap button (circular)
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: CX - BTN_R, y: RING_CY - BTN_R, w: BTN_R * 2, h: BTN_R * 2,
      radius: BTN_R, normal_color: T.active.surface, press_color: T.active.cardHi,
      click_func: function () { _tap(); },
    });

    const countText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - BTN_R, y: RING_CY - px(34), w: BTN_R * 2, h: px(64),
      text: pad3(s.count),
      color: T.active.gold, text_size: px(46),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - BTN_R, y: RING_CY + px(34), w: BTN_R * 2, h: px(24),
      text: "tap untuk hitung",
      color: T.active.muted, text_size: px(13),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    const targetText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: PAD, y: RING_CY + RING_R + px(6), w: W - PAD * 2, h: px(22),
      text: pad3(s.count) + " / " + target,
      color: T.active.muted, text_size: px(15),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    function _render() {
      const frac = Math.max(0, Math.min(1, s.count / target));
      const done = s.count >= target;
      ring.setProperty(hmUI.prop.MORE, {
        end_angle: -90 + 360 * frac,
        color: done ? T.active.emerald : T.active.gold,
      });
      countText.setProperty(hmUI.prop.MORE, { text: pad3(s.count), color: done ? T.active.emerald : T.active.gold });
      targetText.setProperty(hmUI.prop.MORE, { text: pad3(s.count) + " / " + target });
    }

    function _stats() {
      statsText.setProperty(hmUI.prop.MORE, {
        text: "Total " + (s.total || 0) + " · Sesi " + (s.sessions ? s.sessions.length : 0),
      });
    }

    function _tap() {
      s.count += 1;
      s.total = (s.total || 0) + 1;
      if (!s.reached && s.count >= target) {
        s.reached = true;
        s.sessions = s.sessions || [];
        s.sessions.push({ date: todayStr(), dhikr: s.dhikrIdx, target: target });
        if (s.sessions.length > 200) s.sessions.shift();
      }
      if (s.count < target) s.reached = false;
      if (_vib) { try { _vib.start(); } catch (e) {} }
      _render();
      _stats();
      _save(s);
    }

    function _save(v) { store.tasbih.set(v); }

    // Bottom controls: Reset, Target
    _control(W / 2 - px(160), "↺ Reset", function () {
      s.count = 0; s.reached = false; _render(); _stats(); _save(s);
    });
    _control(W / 2 + px(10), "⊙ " + target, function () {
      s.targetIdx = (s.targetIdx + 1) % TARGETS.length;
      _render(); _save(s);
      if (targetBtnText) targetBtnText.setProperty(hmUI.prop.MORE, { text: "⊙ " + TARGETS[s.targetIdx] });
    });

    var targetBtnText = null;
    function _control(x, label, onClick) {
      const w = px(150), h = px(48), y = RING_CY + RING_R + px(34);
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: x, y: y, w: w, h: h, radius: px(12),
        normal_color: T.active.surface, press_color: T.active.cardHi,
        click_func: onClick,
      });
      const t = hmUI.createWidget(hmUI.widget.TEXT, {
        x: x, y: y, w: w, h: h, text: label,
        color: T.active.gold, text_size: px(18),
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      });
      if (label.indexOf("⊙") === 0) targetBtnText = t;
    }

    const statsText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(120), y: RING_CY + RING_R + px(88), w: px(240), h: px(22),
      text: "", color: T.active.muted, text_size: px(14),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });

    _render();
    _stats();
    const openFrac = Math.max(0, Math.min(1, s.count / target));
    try { ring.setProperty(hmUI.prop.MORE, { end_angle: -90 }); } catch (e) {}
    ui.animateArc(hmUI, ring, openFrac, s.count >= target ? T.active.emerald : T.active.gold);
  },

  onDestroy() {
    nav.exitPage(_h);
  },
});
