# AGENTS.md — rails for every model working in this repo

Read this **and** `docs/context/PROJECT-STATE.md` before your first tool call. Symlink or copy
this file to `CLAUDE.md` so Claude Code picks it up too.

Project: **Quran Premium** — Zepp OS 5 mini program for **Amazfit Active 2 Round (466×466)**.

---

## 0. The one rule that matters

**Never write an API you have not verified.**

An invented `@zos/*` module, widget property, or permission compiles fine and fails silently on
the watch — which is the most expensive bug class in this project. Before you use any Zepp API:

```fish
rg -n "<symbol>" node_modules/@zeppos/device-types --glob '*.d.ts'
```

Not in the type declarations and not in an official `docs.zepp.com` page you actually read?
Then it does not exist. Add it to `docs/audit/CAPABILITY-MATRIX.md` as `UNKNOWN`, propose a
spike, and stop — do not "try something similar".

## 1. Environment

- Machine: CachyOS. **Shell = Fish.** `<< EOF` heredocs do **not** work — write files with the
  file tool, never with shell redirection.
- Toolchain: Node ≥ 18, `@zeppos/zeus-cli` (`zeus dev` / `zeus preview` / `zeus build`),
  Zepp OS Simulator, and a **real Active 2 Round** — the simulator lies about fonts, sensors,
  audio and battery. Nothing is "done" until it has run on the watch.
- Types: `@zeppos/device-types` is the source of truth for API signatures.

## 2. Verified API surface (checked 2026-07-12 against docs.zepp.com)

Use these. Anything else → verify first.

| Need | Import | Notes |
|---|---|---|
| Widgets | `import { createWidget, widget, align, text_style, prop, event } from '@zos/ui'` | TEXT, IMG, FILL_RECT, ARC, CIRCLE, GROUP (no nesting), SCROLL_LIST, CANVAS, TEXT_IMG |
| Custom font on TEXT | `createWidget(widget.TEXT, { …, font: 'fonts/x.ttf' })` | The property exists. **Whether Arabic *shapes* correctly is spike S2 — assume it does not.** |
| Scaling | `import { px } from '@zos/utils'` | Wrap every coordinate. `designWidth: 466` in app.json. |
| Routing | `@zos/router` | push / replace / back / home / exit. **Firmware ini: buka page TANPA params → `onInit` menerima string `''`/`'undefined'` (bukan `undefined`)** — selalu guard sebelum `JSON.parse` (foto b5, Al-Lahab). `back()` setelah rantai `replace()` tidak reliable — tombol keluar pakai `replace` eksplisit |
| Gestures | `@zos/interaction` — `onGesture`, `GESTURE_*` | Returning `true` blocks the default. **Never block GESTURE_RIGHT** (system back) outside a modal. |
| Key-value | `import { LocalStorage } from '@zos/storage'` → `new LocalStorage()` | **Instance kecil `localStorage` = "TypeError: not a function" di watch ini (foto b4, 2026-07-14)** — hanya class (`@version 3.0`) yang jalan. Akses HANYA via `src/data/store.js` (yang sudah punya fallback & tidak pernah melempar) |
| Files | `@zos/fs` | For mushaf/audio packs written to the watch |
| Haptics | `import { Vibrator } from '@zos/sensor'` | Start/stop; pick the scene, don't buzz on everything |
| Compass | `import { Compass, checkSensor } from '@zos/sensor'` | `getStatus()`, `getDirectionAngle()`, `onChange`, `start`, `stop` |
| GPS | `import { Geolocation } from '@zos/sensor'` | `getStatus() === 'A'` means a valid fix |
| Audio | `import { create, id } from '@zos/media'` | `create(id.PLAYER)`, `setSource(player.source.FILE, {file})`, `prepare/start/pause/stop`, `seek(pct)`, events PREPARE/COMPLETE. MP3 + OPUS. **API_LEVEL 3.0+; speaker is device-dependent — check it.** |
| Background | `@zos/app-service` (+ permission `device:os.bg_service`) | Has an API limitations table — read it before assuming a module works there |
| Alarms | `@zos/alarm` | Persistent, survives reboot — this is how adhan reminders fire |
| Notifications | `@zos/notification` | |
| Screen | `@zos/display` | Keep-screen-on while reading (opt-in only) |
| Phone↔watch files | `@zos/ble` TransferFile + side-service File Download / Image Conversion | The only way to ship audio and extra mushaf pages |
| i18n | `@zos/i18n` + `.po`, or `text_i18n` on TEXT | Confirm `id-ID` is an accepted locale before relying on it |

## 3. Banned patterns (each one has already cost someone a week)

1. **Bash heredocs** — Fish. Use the file tool.
2. **Hardcoded hex colours or coordinates outside `src/ui/theme.js` / `layout.js`.**
3. **Ignoring the circle.** Every card/row width comes from `safeWidth(y, h)`. A rectangle that
   looks right in the simulator can be sliced by the bezel on the wrist.
4. **Building a widget per data item** (114 surahs, 33 beads, 6236 ayat). Use `SCROLL_LIST`
   `data_array`, one image + one arc, virtualised strips.
5. **Reading `localStorage` outside `src/data/store.js`.**
6. **Leaving a sensor or timer running after `onDestroy`.** Compass and GPS eat the battery.
7. **Touching FROZEN files** — anything under `assets/data/mushaf*`, the Uthmani source, the
   adhkar Arabic, or their checksum manifests. **You may never "correct", reflow, normalise, or
   re-encode a single Arabic character.** If it looks wrong, report it; do not fix it.
8. **Full-screen background other than `0x000000`.** AMOLED battery, not preference.
9. **Blocking the right-swipe.**
10. **Adding a dependency, feature, or refactor that is not in `docs/PLAN.md`.** Ideas go to
    `docs/DECISIONS.md` as backlog. GLM and DeepSeek in particular: if you feel an urge to
    restructure the project, that urge is out of scope — write it down and move on.
11. **`git checkout .`** on someone else's half-finished work.
12. **Marking work done without running it on the real watch.**
13. **`console.error` / `console.warn`** — not proven to exist in this runtime; a broken
    console call inside a `catch` block is how b3's reader died silently. `console.log` only.
14. **UI glyphs outside the proven set.** Proven on this watch (b4 photos): Arabic text,
    Arabic-Indic digits, `﴿ ﴾`, `↩` (renders as emoji), Latin/ASCII. **Tofu (☐): `◄ ► ⌂`.**
    New glyph = test it on the watch first; otherwise use Arabic words.
15. **Reading or writing a preview build without bumping `version.code` + the `BUILD`
    marker in `page/theme.js`.** The Zepp App caches installs per appId+version; a test
    run is only valid if the on-screen marker matches the round you shipped.

## 4. Workflow

- One branch per batch (`batch/g-reader`), small commits per sub-step.
- Commits: `feat(batch-g): …` `fix(batch-g): …` `docs(batch-g): …` `chore(batch-g): pass gate`
- **End every session** by updating `docs/context/PROJECT-STATE.md`: Batch / Progress / Next
  step (precise) / Files touched / Blockers. Even a WIP session commits.
- Hit a quota limit or a blocker? Commit WIP, write PROJECT-STATE, stop. Don't improvise.
- Same error twice in a row → stop and report with your hypothesis. No thrashing.
- Gates are closed by **Ahmed**, in words, after he has looked at the watch. Not by you.

## 5. Tashih (text integrity) — non-negotiable

This app puts the words of Allah on a screen. A mis-shaped letter, a harakat on the wrong base,
a dropped ayah marker — these are not cosmetic bugs.

- The Uthmani source is checksummed; the build fails on mismatch.
- Any rendering path change (font, shaping, rasteriser, image size) **re-opens the tashih
  gate**: Ahmed re-verifies a sample against a printed mushaf before merge.
- If you are uncertain whether a rendered ayah is correct: **render nothing and report it.**
  A blank strip is recoverable. A wrong ayah shipped to a thousand wrists is not.
