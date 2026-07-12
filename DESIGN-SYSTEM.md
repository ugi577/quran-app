# DESIGN SYSTEM — Quran Premium (Amazfit Active 2 Round, 466×466)

Authoritative for all visual work. If code and this file disagree, **this file wins**.
Derived from the approved mockup (`docs/assets/mockup-12-screens.png`).

---

## 1. Canvas & the circle (read this before placing a single pixel)

The mockup is drawn flat. The device is a **circle**. Anything the mockup shows near a corner
does not exist on the watch.

```
screen           466 × 466        center (233, 233)   R = 233
safe circle      R_safe = 213     (20 px bezel margin)
comfort band     dy ≤ 140         everything critical lives here
edge band        140 < dy ≤ 190   decorative / partially clipped only
dead zone        dy > 190         never place text or tap targets here
```

`dy` = distance of the *worst* edge of the element from the vertical centre
(`max(|y - 233|, |y + h - 233|)`).

**Max usable width at a given dy** (chord of the safe circle):

| dy | 0 | 60 | 80 | 100 | 120 | 140 | 160 | 180 | 190 | 200 |
|---|---|---|---|---|---|---|---|---|---|---|
| chord | 426 | 408 | 394 | 376 | 352 | 321 | 281 | 228 | 193 | 147 |
| use   | 400 | 396 | 384 | 368 | 344 | 312 | 272 | 220 | 184 | 140 |

Ship this helper in `src/ui/layout.js` and use it for **every** card/row — no hand-tuned
widths:

```js
const R_SAFE = 213, CX = 233, CY = 233;
export function safeWidth(y, h, max = 400) {
  const dy = Math.max(Math.abs(y - CY), Math.abs(y + h - CY));
  if (dy >= R_SAFE) return 0;
  return Math.min(max, Math.floor(2 * Math.sqrt(R_SAFE * R_SAFE - dy * dy)) - 16);
}
export const centerX = (w) => Math.round(CX - w / 2);
```

Scroll lists are the exception: items scroll *through* the edge bands, so they may use the
standard 396 width and accept corner clipping — but their **text must be inset ≥ 24 px** from
the card edge so it never touches the bezel.

---

## 2. Colour tokens

AMOLED: black pixels are **off**. Full-screen background is always exactly `0x000000` —
never `0x0A0A0A`, never a dark grey "almost black". This is a battery decision, not taste.

| Token | Hex | Zepp int | Use |
|---|---|---|---|
| `bg` | #000000 | `0x000000` | page background, always |
| `surface` | #101010 | `0x101010` | cards, list rows |
| `surfacePress` | #1A1A1A | `0x1A1A1A` | pressed state |
| `stroke` | #262626 | `0x262626` | 1 px hairline border |
| `strokeGold` | #6B5720 | `0x6B5720` | gold hairline (focused card) |
| `gold` | #D4AF37 | `0xD4AF37` | headers, numerals, primary accent |
| `goldBright` | #F2DE9B | `0xF2DE9B` | highlight, ornament top |
| `goldDim` | #8A7328 | `0x8A7328` | inactive gold, dividers |
| `emerald` | #0B6B4A | `0x0B6B4A` | brand green, buttons |
| `emeraldBright` | #17A673 | `0x17A673` | active/progress/selection |
| `emeraldSoft` | #0E3A2A | `0x0E3A2A` | selected row fill |
| `textHi` | #FFFFFF | `0xFFFFFF` | primary text |
| `textMd` | #B8B8B8 | `0xB8B8B8` | secondary text |
| `textLo` | #6E6E6E | `0x6E6E6E` | tertiary / disabled |

Rules
- Gold is for **structure and meaning** (surah name, ayah number, prayer countdown), never for
  large fills. Large gold areas burn battery and look cheap.
- Emerald marks **the current thing** (next prayer, playing surah, selected row, progress).
- Max **two** accent colours visible per screen. The mockup obeys this; keep it.
- No gradients across large areas. A gradient is allowed only inside ornaments ≤ 96 px.

---

## 3. Typography

Zepp minimum legible size at this DPI is **24 px**. Nothing below 24 except decorative rules.
Line height = `text_size + 10` (Zepp text-box rule).

| Role | Size | Colour | Example in mockup |
|---|---|---|---|
| `display` | 96 | textHi | Tasbih count `124` |
| `h1` | 44 | gold | Qibla `247°` |
| `h2` | 34 | gold | Screen title `Al-Baqarah`, `Hisnul Muslim` |
| `bodyLg` | 30 | textHi | List primary (`Al-Fatihah`, `Maghrib`) |
| `body` | 28 | textHi | Card value (`Al-Mulk`) |
| `label` | 24 | gold / textMd | Card label (`Continue Reading`), `Ayah 8` |
| `caption` | 24 | textLo | `Target: 1000`, `Juz 29 / Page 562` |

**Arabic is not typography here — it is an asset.** See §6.

---

## 4. Shape, spacing, motion

- Radius: card `24`, big card `28`, pill `28` (on h=56), chip `16`, circle button `= h/2`.
- Page padding: `24`. Card padding: `20` horizontal, `16` vertical. Gap between cards: `12`.
- **Tap target ≥ 72 × 72.** Icon-only buttons: 72 circle, glyph 32.
- Row height: list `76`, compact list `56`, prayer row `48`.
- Icon container in cards: 48 rounded-square (radius 14), glyph 28, tinted with the row's accent.
- Motion: page transition ≤ 200 ms, press feedback ≤ 80 ms, never animate more than one
  property at a time, never run an animation while a sensor is streaming.
- **Haptics** (`Vibrator`): tap = short/weak; tasbih count = short/strong; tasbih target reached
  and prayer entry = long/strong. Nothing else vibrates.

---

## 5. Components (build once, in `src/ui/`, reuse everywhere)

| Component | Spec |
|---|---|
| `Header(title, subtitle?)` | title `h2` gold, centred, `y=40`; optional subtitle `caption` textMd at `y=78`. Never a back-arrow *and* a title fighting for the same row — back is the system right-swipe. |
| `Card({y, icon, label, value, accent})` | `w = safeWidth(y, 84)`, h 84, r 24, fill `surface`, 1 px `stroke`. Icon container left at `x+16`. `label` (24, gold) at `y+14`, `value` (28, textHi) at `y+44`. Whole card is one tap target. |
| `ListRow({y, left, right, selected})` | h 76, r 24, fill `surface`, selected → fill `emeraldSoft` + 4 px `emeraldBright` bar at the left edge (radius 2). Left text `bodyLg` textHi inset 24; right text `bodyLg` gold, right-inset 24. |
| `IconButton({cx, cy, glyph, variant})` | 72 circle. `ghost` = 2 px gold ring, transparent fill. `solid` = `emerald` fill + 2 px `gold` ring. |
| `PillButton({y, text})` | h 56, w 200, r 28, fill `emerald`, text 28 textHi. |
| `ProgressBar({y, pct})` | h 6, r 3, track `#1A1A1A`, fill `emeraldBright`. |
| `RingProgress({pct})` | ARC, r 200, line 10, track `goldDim` @ low alpha, fill `emeraldBright`, start `-90°`, clockwise. |

---

## 6. Arabic / Mushaf rendering — the decisive rule

**Do not render Quranic Arabic through the TEXT widget until spike S2 says you may.**

Zepp OS has no guaranteed Arabic shaping engine: letters may fail to join, harakat may not
stack on the correct base letter, and word order may reverse. The mockup's beautiful Uthmani
lines are only reproducible if the shaping happens **on the desktop, before the app ever
runs.**

Default architecture (`RENDER-A`, assume this until S2 proves otherwise):

```
Tanzil Uthmani text  →  offline pipeline (HarfBuzz shaping + Amiri Quran/OFL font)
                     →  PNG strip per mushaf line, 1-bit alpha, gold or white on transparent
                     →  IMG widget on the watch
```

- Strip width ≤ 400 px, height ≈ 96 px, only visible strips instantiated, off-screen strips
  destroyed. Never build 6236 widgets.
- Bundle Juz 30 + Al-Kahf + Yasin + Ar-Rahman + Al-Waqi'ah + Al-Mulk. Everything else is a
  downloadable pack (side-service download → image conversion → `TransferFile` → watch FS,
  LRU-evicted).
- Ayah number is a **separate small ornament asset** (gold circle glyph + Latin digits), not
  part of the strip. This keeps strips reusable and lets us re-colour the ornament.
- Surah names in Arabic (`سورة الملك` in the mockup) are also **image assets** — 114 tiny PNGs,
  ~2 KB each. Do not try to draw them with a font.

Fallback (`RENDER-B`, only if S2 passes): TEXT widget + bundled OFL Quran TTF + text
pre-converted offline to Arabic Presentation Forms in visual order. Smaller package, but only
acceptable if harakat stack correctly on-device. **Ahmed makes this call after seeing photos
of the real watch, not the simulator.**

Text integrity: the Uthmani source is FROZEN. The pipeline may shape and rasterise it; it may
never edit it. Ship a SHA-256 manifest of the source text and fail the build on mismatch.

---

## 7. Screen specs (12 screens, matching the mockup)

Coordinates are top-left of the element. `W(y,h)` = `safeWidth(y,h)`.

### 7.1 Home Dashboard
- `y=30` crescent glyph 28 gold, centred.
- `y=58` Hijri date, `label`, textMd, centred. `y=92` clock `h2` textHi, centred.
- Scrollable card stack from `y=136`, h 84, gap 12 → cards at 136 / 232 / 328 / 424 (scroll).
  1. Continue Reading — book icon, gold label, `Al-Mulk` / `Ayah 8` → Reader at last position.
  2. Next Prayer — mosque icon, `Maghrib` + emerald countdown `00:52` right-aligned.
  3. Tasbih — beads icon, current count.
  4. Continue Audio — play icon, last surah. Hidden entirely if audio is disabled (S3 fail).
- Tapping a card opens its page. Long-press does nothing (reserved).

### 7.2 Quran Reader
- Header: surah name `h2` gold at `y=36`; `2 / 286` `caption` textMd at `y=76`.
- Content: vertical scroll of line-strips from `y=112` to `y=356`, centred, spacing 16.
  Bismillah strip first (except At-Tawbah), then ayah strips.
- Bottom bar, fixed, `y=372`: `←` ghost icon at `cx=145`, bookmark toggle at `cx=233`
  (gold when set), `→` at `cx=321`. Row dy ≈ 211 → the bar sits at h=64, cx-spacing 88,
  which fits inside the chord. Do not add a fourth button.
- **Never intercept the right-swipe** — that is the system back gesture. Ayah navigation is
  the arrow buttons and vertical scroll only.
- Optional (settings): keep screen on while this page is open.

### 7.3 Surah List
- Header `Surah` at `y=36`, search icon 40 px at `x=380, y=36` (opens jump-to dialog: number
  input, not a keyboard).
- `SCROLL_LIST`, item h 76, w 396, r 24: index (gold, 28, left inset 24), Latin name (30,
  textHi), Arabic name image (right inset 24). Current surah row uses the `selected` style.
- 114 items via `data_array`, **not** 114 hand-built widgets.

### 7.4 Audio Quran *(only if S3 passes)*
- Title `h2` gold `y=40`; reciter `caption` textMd `y=80`.
- Centre ornament: gold ring r 96 at (233,233) + emerald `RingProgress` showing position.
  Play/pause `IconButton solid` 72 at centre.
- Elapsed `05:24` (24, textMd) at `x=64,y=300`; total right-aligned at `x=402,y=300`;
  `ProgressBar` between them at `y=286`.
- Transport row `y=356`: prev / play-pause / next, 72 px each, gaps 24 (total 264 ≤ chord 283).
- Secondary row `y=420`: repeat, speed, more — 48 px icons, gap 14 (total 172). Optional; drop
  it before you let it clip.

### 7.5 Prayer Times
- City + pin `label` gold `y=32`; Hijri date `caption` textMd `y=66`.
- Five rows h 48, gap 6, from `y=118` → 118/172/226/280/334, `w=300`, `x=83`.
  Name left inset 20 (`bodyLg`), time right inset 20 (`bodyLg`). Next prayer row = `selected`
  style (emeraldSoft + bright bar). Bell icon (32) only on rows with a reminder enabled.
- Countdown `y=392`, hourglass glyph + `00:52` in gold, centred, `h1`-ish 34.

### 7.6 Tasbih
- Bead ring: **one pre-rendered PNG** of 33 emerald beads on the circle (r 200) + an ARC drawn
  over it to show progress. Do not create 33 CIRCLE widgets.
- `الله` ornament image at `y=96`, centred, 64 px.
- Count `display` (96, textHi) centred at `y=180`. `Target: 1000` `caption` at `y=296`.
- Controls `y=336`: `−` ghost 72 at cx 145, reset ghost 72 at cx 233, `+` ghost 72 at cx 321.
- **Whole screen above the controls is also a +1 tap zone** (the real interaction), with a
  short-strong haptic per count, long-strong at target.
- Page dots at `y=430` if multiple dzikir presets exist.

### 7.7 Qibla
- `Qibla` `label` gold `y=44`; bearing `h1` gold `y=76`.
- Compass rose: tick ring r 190 (image asset), cardinal letters N/E/S/W (28, textMd) at r 160.
- Kaaba glyph 64 at centre. Gold pointer triangle rotates to `qiblaBearing − heading`.
- Show a calibration hint (figure-8 icon + text) whenever `compass.getStatus()` is falsy;
  never show a stale bearing as if it were live.
- If `checkSensor(Compass)` is false: hide the rose, show bearing-from-north as a number plus
  "point your watch north" — degrade, don't crash.

### 7.8 Hisnul Muslim
- Header `y=36`. Four `ListRow`s (h 76, r 24) from `y=104`, gap 12: Morning / Evening /
  After Prayer / Protection. Circular icon 48 left, chevron gold right.
- Detail page = same line-strip renderer as the Reader, plus a per-dzikir repeat counter that
  reuses the Tasbih haptics.

### 7.9 Bookmarks / 7.10 Favorites
- Same `SCROLL_LIST` shell as Surah List. Bookmarks: surah + `Ayah N` (caption, textMd) +
  gold bookmark glyph. Favorites: surah + Arabic name image + emerald heart glyph.
- Swipe-left on a row reveals delete (or, if that fights the router, long-press → confirm modal.
  Decide in Batch L; pick one, document it in DECISIONS).
- Empty state is a real screen, not a blank page: centred glyph + one line of textLo.

### 7.11 Continue Reading
- Big card: `x=48, y=120, w=370, h=180`, r 28, fill `surface`, 2 px `strokeGold`.
  Book icon 56 left; surah Latin (`h2` textHi), Arabic name image, `Ayah 8` (`label` textMd).
- `ProgressBar` `y=330`; `Juz 29 / Page 562` `caption` centred `y=350`.
- `PillButton` "Read Now" centred at `y=384`.

### 7.12 Settings
- `SCROLL_LIST`, rows h 76: Language / Audio Reciter / Notifications / Display / Calculation
  method / Madhab (Asr) / Hijri offset / About.
- Each row: circular icon 48 (gold glyph), title (28 textHi), current value (24 textMd) below,
  chevron gold right.
- Heavy settings (reciter download, mushaf packs) live in the **phone Settings App**, not here.

---

## 8. Performance budget (a design constraint, not an afterthought)

| Budget | Limit |
|---|---|
| Widgets alive per page | ≤ 60 |
| Images alive per page | ≤ 8 |
| JSON parsed per page | ≤ 64 KB |
| Cold start → first paint | < 800 ms |
| Page transition | < 200 ms |
| Timers running while a page is idle | 0 (except the 1 Hz clock on Home) |
| Sensors running when their page is not visible | 0 — stop them in `onDestroy`, always |

If a screen cannot be built inside this budget, the screen is wrong, not the budget.
