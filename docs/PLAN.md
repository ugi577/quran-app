# PLAN — Quran Premium

Executable plan. Each batch = branch → small commits → Ahmed verifies → gate checklist →
`chore(batch-x): pass gate` → `merge --no-ff` → next branch.

**Golden rules**
- Features stop being added the moment gate verification starts.
- A gate is closed only by Ahmed's explicit **LULUS**.
- Never merge code with a known bug.
- Blocked? Commit WIP, write the blocker into `docs/context/PROJECT-STATE.md`, stop.

**Commits:** `feat(batch-c): …` · `fix(batch-c): …` · `docs(batch-c): …` · `chore(batch-c): pass gate`
**Branches:** `batch/a-skeleton`, `batch/b-theme`, …

---

## Phase 0 — Know before you build

### Batch 0 — Architecture audit *(clo, high)*
Run `docs/prompts/00-AUDIT.md`. No code.
**Gate 0:** `docs/audit/{AUDIT,CAPABILITY-MATRIX,RISKS,ROADMAP}.md` exist · every capability row
has evidence or `UNKNOWN` · zero invented APIs · Ahmed has read the "five least sure" list.

### Spikes S1–S5 *(cc-deep, high — throwaway code in `spikes/`, never merged to `src/`)*

| Spike | Question | Pass criterion | Unblocks |
|---|---|---|---|
| **S1** | Does the toolchain reach the real watch? | `zeus create` → build → install → a TEXT widget appears on the Active 2 | everything |
| **S2** | **Can this device render Quranic Arabic?** 4 variants side by side (see 00-AUDIT §S2) | Letters joined, harakat on the correct base letter, correct word order, legible — *photographed on the real watch* | Batch G (Reader), the whole asset pipeline |
| **S3** | Speaker? mp3 from FS? background playback? transfer speed? MB budget? | 64 kbps mono mp3 plays from watch FS, survives UI close | Batch M (Audio), F12, Home card 4 |
| **S4** | `checkSensor(Compass)` / `Geolocation` on-device; fix time; drift | Bearing stable ±5° after calibration; GPS fix < 60 s outdoors | Batch H, Batch J |
| **S5** | RAM per widget / per image; max package size | Numbers written into `RISKS.md` | the whole performance budget |

**Gate S:** every spike has a written result + a photo/log. **S2's verdict is recorded in
`DECISIONS.md` as D-001 and is final** — it decides RENDER-A vs RENDER-B and cannot be
re-litigated by a later model.

---

## Phase 1 — Foundations

### Batch A — Skeleton *(cc-deep, lo)*
1. `zeus create` an APP project (with app-side + settings) → reconcile into the repo.
2. `app.json`: appId, target = Active 2 Round (from the audit, **not** from memory),
   `designWidth: 466`, permissions (`device:os.local_storage`, geolocation, compass,
   `device:os.bg_service`, notification — only the ones actually used).
3. Folder contract:
   ```
   app.js  app.json
   page/            one file per screen, thin — no business logic
   src/ui/          theme.js layout.js components.js icons.js
   src/data/        store.js quran.js prayer.js qibla.js tasbih.js adhkar.js
   src/services/    audio.js packs.js notify.js
   app-side/        index.js  (network, downloads, image conversion)
   setting/         index.js  (phone settings app)
   assets/<target>/ images, data, fonts
   spikes/          throwaway, never imported by src/
   ```
4. `.editorconfig`, eslint (no new runtime deps), `README.md`, `.gitignore` (`dist/`, `node_modules/`).
5. `npm run build` works; `zeus dev` opens the simulator.

**Gate A:** builds clean · installs on the real watch · empty page renders on black ·
no dependency added outside this list · PROJECT-STATE updated.

### Batch B — Theme & components *(glm, lo)*
Implement `src/ui/theme.js` (tokens from DESIGN-SYSTEM §2/§3), `layout.js` (`safeWidth`,
`centerX`, spacing), `components.js` (Header, Card, ListRow, IconButton, PillButton,
ProgressBar, RingProgress), `icons.js` (icon asset registry).
Add `page/dev-gallery.js` — a hidden page rendering every component at three `y` positions so
the safe-area math is visible on the real screen.

**Gate B:** every token from DESIGN-SYSTEM exists and nothing hardcodes a hex outside
`theme.js` (`rg -n "0x[0-9a-fA-F]{6}" src page | grep -v theme.js` → empty) · gallery renders
on-device with no element touching the bezel · ≤ 60 widgets on the gallery page.

### Batch C — Navigation shell *(glm, lo)*
Page registry, `src/ui/nav.js` wrapping `@zos/router`, back handling, press feedback + haptics,
transitions ≤ 200 ms, a `BasePage` helper that guarantees `onDestroy` stops timers and sensors.

**Gate C:** every page reachable and returnable · right-swipe back works everywhere ·
no timer or sensor survives a page destroy (proved by a log line) · transitions measured.

### Batch D — Data layer *(cc-deep, high)*
`src/data/store.js` (namespaced, versioned, migration fn, single access point) ·
`quran.js` (surah/juz/page indexes, lazy per-surah loading, LRU cache) ·
asset pipeline script `tools/build-mushaf.mjs` (Tanzil Uthmani → HarfBuzz shaping → PNG
line-strips + manifest + **SHA-256 integrity check on the source text**).
Bundle: Juz 30 + Al-Kahf, Yasin, Ar-Rahman, Al-Waqi'ah, Al-Mulk.

**Gate D:** `store.get/set` round-trips and survives a reboot · corrupting a stored value
degrades gracefully instead of crashing · pipeline is reproducible (same input → identical
hashes) · **Ahmed's manual tashih: 20 sampled ayat rendered vs the printed mushaf — LULUS
required, no exceptions.**

---

## Phase 2 — Screens

### Batch E — Home dashboard *(glm, lo)* → Gate E: 4 live cards, real data, < 800 ms cold start.
### Batch F — Surah browser *(glm, lo)* → Gate F: 114 items via `SCROLL_LIST` `data_array`, smooth scroll, jump-to works, ≤ 60 widgets.
### Batch G — Quran reader *(clo, high — this is the heart of the app)*
Line-strip renderer per D-001, virtualised (only visible strips alive), ayah nav, bookmark
toggle, last-read write-back on destroy, juz/page indicator, optional keep-screen-on.
**Gate G:** no strip pop-in on scroll · correct Arabic on a photographed real device ·
resume lands on the exact ayah after a force-close · ≤ 8 images alive · **Ahmed's tashih LULUS.**
### Batch H — Prayer times *(cc-deep, high)*
Pure-JS solar calc (no library), methods incl. Kemenag, madhab, ihtiyat, hijri conversion +
offset, location (GPS → cache → manual), countdown, `@zos/alarm` reminders re-armed daily by
`@zos/app-service`.
**Gate H:** times match a trusted reference (Kemenag/IslamicFinder) for **3 cities × 3 dates**
within ±1 min · reminder fires with the app closed · stale-location warning shows.
### Batch I — Tasbih *(glm, lo)* → Gate I: count survives restart · haptics correct · full-screen tap zone · ring is 1 image + 1 arc, not 33 widgets.
### Batch J — Qibla *(cc-deep, high)* → Gate J: bearing verified against a known reference in 2 cities · calibration state honest · degrades without a compass.
### Batch K — Hisnul Muslim *(glm, lo)* → Gate K: 4 categories render · repeat counters + haptics · **Ahmed's tashih on the Arabic LULUS.**
### Batch L — Bookmarks / Favorites / Continue *(glm, lo)* → Gate L: add, remove, jump, empty states, caps enforced.
### Batch M — Audio *(clo, high — only if S3 passed)*
Player service, pack download (app-side → TransferFile), queue, seek, speed, background
survival, storage manager. If S3 failed: delete F12 from the PRD, remove the Home card, write
D-00x in DECISIONS. **No stub screens.**
**Gate M:** playback survives UI close · seek accurate · pack download resumable · storage cap enforced.
### Batch N — Settings (watch + phone) *(glm, lo)* → Gate N: every setting persists, takes effect immediately, and has a sane default; phone Settings App writes reach the watch.

---

## Phase 3 — Finish

### Batch O — Motion & polish *(glm, lo)*
Transitions, press states, skeletons, empty/error states, icon pass, splash/brand screen.
**Gate O:** no unstyled state anywhere · no animation while a sensor streams.

### Batch P — Performance, battery, release *(clo, xhigh)*
Widget/RAM audit per page against the budget · cold-start and transition measurements ·
24-hour battery test · remove dev-gallery and spikes from the build · icon + store assets ·
version + CHANGELOG · `zeus build` → signed package.
**Gate P:** every number in DESIGN-SYSTEM §8 met or explicitly waived in DECISIONS ·
battery < 4 %/day over baseline · package installs from a clean watch · Ahmed's final LULUS.

---

## Execution order (dependencies)

```
Batch 0 → S1 → S2 ─┬→ A → B → C → D ─┬→ E → F → G ─┬→ O → P
             S5 ───┘                  ├→ H          │
             S4 ────────────────────→ ├→ J          │
             S3 ────────────────────→ ├→ M ─────────┤
                                      ├→ I, K, L, N ┘
```
E/F/H/I/J/K/L/N can run in parallel across models once D is merged. **G and M wait for their
spikes.** Nothing waits for O.

## Model routing

| Work | Model | Effort |
|---|---|---|
| Audit, reader, audio, gates, final perf | `clo` | high–xhigh |
| Bulk screens, components, lists, settings | `glm` | lo |
| Pipelines, math (prayer/qibla), spikes, build | `cc-deep` | lo–high |

If a routine batch feels like it needs `xhigh`, the document is unclear — **fix the document,
not the model.**

## PLAN changelog
- 2026-07-12 — v1.0 — initial plan (Batch 0 + S1–S5 + A–P).
