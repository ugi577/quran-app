# PROMPT 0 — ARCHITECTURE AUDIT & CAPABILITY MATRIX (NO CODE)

> Paste this whole file as the first message of a fresh session in
> `/home/cachymac/Projects/quran-premium`. Recommended runner: `clo` (high) or `cc-deep`.
> This is the **only** prompt in the project that produces no code.

---

## ROLE

You are a senior Zepp OS 5 architect + embedded UI engineer. Target device:
**Amazfit Active 2 (Round)** — 466×466 AMOLED, Zepp OS 5.

## HARD RULES FOR THIS SESSION

1. **Do not write, modify, refactor, or delete any source file.** The only files you may
   create are the four report files listed under OUTPUT CONTRACT.
2. **Do not install anything** except read-only inspection of what already exists.
3. **Never state an API, module, widget, property, permission, or CLI flag as "supported"
   unless you have first-hand evidence.** Evidence = a file path + line number in this
   machine's SDK/type declarations, or an official `docs.zepp.com` URL you actually read.
   No evidence → the row is `UNKNOWN`, and it becomes a spike. Guessing an API name is the
   single worst failure mode of this session; a report full of honest `UNKNOWN`s is a good
   report, a report with an invented `@zos/quran` module is a worthless one.
4. **Shell is Fish.** No bash heredocs (`<< EOF`). Write files with the file tool, not shell
   redirection.
5. If a command fails twice with the same error, stop and write it into `RISKS.md` as a
   blocker. Do not thrash.

## STEP 1 — GROUND TRUTH (run these before you think)

```fish
cd /home/cachymac/Projects/quran-premium
git log --oneline -10; git status --short
ls -la
node -v; npm -v
npx @zeppos/zeus-cli --version 2>/dev/null; or echo "zeus-cli NOT installed"
test -f app.json; and cat app.json
test -f package.json; and cat package.json
fd -e js -e json -e ts . --max-depth 3 2>/dev/null | head -60
du -sh assets 2>/dev/null; du -sh . 2>/dev/null
ls node_modules/@zeppos 2>/dev/null
```

Then, if `@zeppos/device-types` is present, **this is your primary source of truth** — it is
the SDK's own type declaration package:

```fish
fd -e d.ts . node_modules/@zeppos/device-types | head -50
rg -n "declare module|export function|export class" node_modules/@zeppos/device-types --glob '*.d.ts' | head -80
```

If it is **not** present, say so explicitly in `AUDIT.md` and treat every API as `UNKNOWN`
until confirmed against `docs.zepp.com`. Do not proceed on memory.

## STEP 2 — CLASSIFY THE REPO

Decide and state which case this is:

- **Case A — Greenfield** (empty / only docs): skip the "current implementation" sections,
  and instead produce a *target* architecture. Say clearly: "no existing code to audit".
- **Case B — Existing code**: perform the full audit below.

Do not fabricate an "existing architecture" that isn't there. If the folder holds only
scaffolding, say so in one line and move on.

## STEP 3 — AUDIT (Case B only; skip cleanly if Case A)

For each item: **file path → what it does → verdict** (`KEEP` / `REDESIGN` / `DELETE` /
`FROZEN`). No prose without a path attached.

1. Entry points: `app.js`, `app.json` (targets, deviceSource, permissions, apiVersion,
   designWidth, module.page list), `page/**`.
2. Navigation: how pages are pushed/replaced/popped; who owns back; any gesture handlers.
3. Every UI component and where it is defined; duplication between pages.
4. Every Quran-rendering path (text widget? image? canvas?) and where the ayah data enters it.
5. Quran/mushaf data: file format, on-disk size, how it is read (`@zos/fs`? bundled JSON?),
   whether it is loaded eagerly or lazily, peak memory implied.
6. Prayer times: algorithm source, location source, timezone handling, caching, alarms.
7. Localization: `.po` files, `@zos/i18n` usage, `text_i18n` usage, RTL handling.
8. Assets: per-target folder layout, image formats, total size, unused assets.
9. Fonts: any custom `.ttf`, how referenced, glyph coverage.
10. Layout engine: hardcoded coordinates vs `px()` vs `zosLoader:*.layout.js`; round-screen
    safe-area handling (or absence of it).
11. Storage: `@zos/storage` keys, `@zos/fs` paths, schema versioning, migration.
12. Settings persistence: device side vs Settings App (phone) vs side-service.
13. App lifecycle: `onInit`/`build`/`onDestroy`, sensor start/stop, timer leaks.
14. Rendering performance: widget count per page, work done in `build()`, per-frame timers.
15. Technical debt: dead code, copy-paste, magic numbers, silent failures.
16. **Files that must stay FROZEN** (validated Arabic text, licensed data, anything with a
    checksum). List them explicitly — later batches are forbidden to touch these.

## STEP 4 — CAPABILITY MATRIX (this is the heart of the audit)

Produce `CAPABILITY-MATRIX.md`. One row per capability the Premium app needs. **Every row
must carry evidence or be marked UNKNOWN.**

| # | Capability | Module / API | Status | Evidence (path:line or doc URL) | Risk | Fallback if unavailable |
|---|---|---|---|---|---|---|

Rows you must fill in (do not add features, do not drop rows):

| Capability | Candidate API |
|---|---|
| Build & install to real device | `@zeppos/zeus-cli` (`zeus dev` / `preview` / `build`) |
| Exact target key + deviceSource for **Amazfit Active 2 Round** | generated `app.json` from `zeus create`, and/or simulator device list |
| Screen adaptation | `px()` from `@zos/utils`, `designWidth` in app.json |
| Widgets available | `@zos/ui` → TEXT, IMG, FILL_RECT (radius?), ARC, CIRCLE, GROUP, SCROLL_LIST, CANVAS, PAGE_SCROLLBAR, TEXT_IMG |
| **Arabic rendering via TEXT widget** (joined forms + harakat) | `@zos/ui` TEXT `font: 'fonts/x.ttf'` |
| **Custom TTF**: does the toolchain accept it, what glyph range survives the build, package size cost | same |
| Image rendering of pre-rendered ayah/page strips | `@zos/ui` IMG, supported PNG format/bit-depth, RAM per image |
| List of 114 items without 114 live widgets | `@zos/ui` SCROLL_LIST (`data_array`, `item_click_func`) |
| Gestures / swipe | `@zos/interaction` `onGesture`, `GESTURE_*`; whether returning `true` blocks system back |
| Routing | `@zos/router` push/replace/back/home/exit |
| Key-value storage | `@zos/storage` `localStorage` |
| File system read/write on watch | `@zos/fs` |
| Haptics | `@zos/sensor` `Vibrator` + available scenes |
| Compass heading (for Qibla) | `@zos/sensor` `Compass` (`getDirectionAngle`), `checkSensor()` |
| GPS fix (for prayer times / qibla) | `@zos/sensor` `Geolocation` (`getStatus()==='A'`), time-to-fix, battery cost |
| Time & timezone | `@zos/sensor` `Time` / system settings |
| **Speaker present on Active 2?** | `@zos/media` player + speaker availability check |
| Audio playback of local mp3 | `@zos/media` `create(id.PLAYER)`, `setSource(player.source.FILE)`, `prepare/start/pause/seek` |
| Phone→watch file transfer (audio/mushaf packs) | `@zos/ble` TransferFile + side-service File Download + Image Conversion |
| Background execution (prayer alarms, audio) | `@zos/app-service` (+ `device:os.bg_service`), and its **API limitations table** |
| Scheduled wakeup / adhan reminders | `@zos/alarm` |
| System notifications | `@zos/notification` |
| Screen-on while reading | `@zos/display` (`setPageBrightTime`, `pauseDropWristScreenOff`) |
| Settings App on phone | `setting/index.js`, `settingsStorage` |
| i18n incl. `id-ID` locale availability | `@zos/i18n`, `.po` files |
| **Package size limit** for a .zab/.zpk mini program | Zepp Open Platform docs / CLI error |
| appId: numeric, issued by Zepp Open Platform? | generated app.json + console |

## STEP 5 — SPIKES (define, do not run)

Write `RISKS.md` containing, for each blocking unknown: a **≤ 2-hour experiment**, the exact
pass/fail criterion, and what design decision it unblocks. At minimum:

- **S1 — Toolchain smoke test.** `zeus create` a throwaway project in `/tmp`, build for
  Active 2 (or nearest 466×466 round target), install to the real watch. Pass = a TEXT
  widget renders on-device. Unblocks: everything.
- **S2 — ARABIC RENDERING (the project's #1 blocker).** On-device, side by side:
  (a) TEXT widget, system font, Uthmani string with harakat;
  (b) TEXT widget + bundled Quran TTF (Amiri Quran / Scheherazade New — OFL);
  (c) TEXT widget + TTF + text **pre-shaped offline into Arabic Presentation Forms**, string
      reversed into visual order;
  (d) IMG widget showing a PNG strip of the same ayah pre-rendered offline with HarfBuzz.
  Pass criterion is strict: letters joined correctly, harakat stacked on the correct base
  letter, no tofu, no reversed word order, legible at 466px. Photograph the watch face for
  each. Report RAM per image and per-page build time for (d).
  **Prior belief to disprove, not to assume:** Zepp OS text rendering has no Arabic shaping
  engine and RTL is firmware/font-pack dependent, so (a)–(c) are expected to fail on harakat
  stacking and (d) is expected to win. Test it anyway — if (b) or (c) passes, the app gets
  dramatically smaller.
- **S3 — Audio.** Does Active 2 have a speaker; does `@zos/media` play a 64 kbps mono mp3
  from the watch FS; can `@zos/app-service` keep it playing with the UI closed; how many MB
  fit; how fast does TransferFile move 5 MB from the phone.
- **S4 — Sensors.** `checkSensor(Compass)` / `checkSensor(Geolocation)` on the real device;
  cold GPS fix time indoors and outdoors; compass drift and calibration UX.
- **S5 — Budget.** Empty page RAM, RAM per widget, RAM for a 466×140 image, and the maximum
  package size the platform accepts.

## STEP 6 — ROADMAP

Do **not** invent your own phase list. Map your findings onto the batches already defined in
`docs/PLAN.md` (A → P) and, for each batch, state: *ready to start* / *blocked by spike Sx* /
*needs a PLAN change* (say which line). If you believe the plan is wrong, argue it in
`RISKS.md` — do not silently rewrite it.

---

## OUTPUT CONTRACT (exactly four files, nothing else)

| File | Contains |
|---|---|
| `docs/audit/AUDIT.md` | Case A/B verdict, ground-truth dump, Step-3 audit table, FROZEN file list |
| `docs/audit/CAPABILITY-MATRIX.md` | The Step-4 table, every row with evidence or `UNKNOWN` |
| `docs/audit/RISKS.md` | Spikes S1–S5 with pass/fail criteria, blockers, PLAN objections |
| `docs/audit/ROADMAP.md` | Batch A–P readiness map + recommended execution order + model routing |

Then update `docs/context/PROJECT-STATE.md` (Batch / Progress / Next step / Files touched)
and commit: `docs(batch-0): architecture audit + capability matrix`.

Finally, print — in chat, not in a file — the **five things you are least sure about**, in
priority order. That list is what Ahmed will verify first.

## FORBIDDEN IN THIS SESSION

- Writing or editing any `.js`, `.json` (other than the four reports), or asset.
- Refactoring, "quick fixes", dependency installs, `git checkout .`.
- Any sentence of the form "Zepp OS supports X" without evidence next to it.
- Proposing features that are not in `docs/PRD.md`. New ideas go to `docs/DECISIONS.md`
  as backlog, and only if Ahmed asks.
