# RISKS — Quran Premium

**Date:** 2026-07-12
**Status:** Pre-Batch 0 — Spikes must run before any feature work begins

---

## Critical Risks (Resolved by Decision)

### ✅ D-001 — Arabic Rendering Strategy
**Status:** RESOLVED — RENDER-A (pre-shaped images) is the default path.
**Impact:** Without this decision, Batch G (Reader) and Batch D (Data Layer) cannot proceed.
**Mitigation:** Build the offline HarfBuzz pipeline; ship line-strip PNGs. Spike S2 is now "upside probe" only.
**See:** `DECISIONS.md` D-001

---

## Spikes (Required Before Batch A)

### S1 — Toolchain Smoke Test
**Question:** Can we build, deploy, and render to the real Amazfit Active 2?

**Pass Criterion:**
1. `zeus create` generates a project with API Level 4.2 (or 4.0)
2. `zeus build` produces a `.zab`/`.zpk` without errors
3. `zeus preview` installs to the real Active 2 Round
4. A TEXT widget with "بسم الله" renders on the actual watch face (photographed)

**Failure Mode:** Any step fails → blocker for all batches. Toolchain issue.

**Time Budget:** 30 minutes

**Unblocks:** Everything

**Commands:**
```fish
cd /tmp
zeus create quran-test --appType APP --APILevel 4.0 --shape round
cd quran-test
# Edit page/index.js: add TEXT widget with Arabic
zeus preview
```

---

### S2 — Arabic Rendering (Now "Upside Probe")
**Question:** Can we do better than RENDER-A (line strips)?

**S2-a — Cheap Test (30 min): TEXT widget + system font**
- Test: TEXT widget with `text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ"` (harakat)
- Pass: Letters join correctly, harakat stack on correct base, no reversed order
- Expected: **FAIL** (Zepp OS has no Arabic shaping)
- If PASS: Massive package size savings (no images needed)

**S2-b — Glyph Atlas + CANVAS (the real prize):**
- Test: `@zos/ui` CANVAS.drawImage() with ~300 tiny glyph PNGs
- Pass: Can draw ~100 glyphs per frame at 60fps on Active 2
- Expected: **UNKNOWN** (CANVAS performance on this device is unverified)
- If PASS: ~3-5 MB for entire Quran vs ~20-35 MB line strips

**S2-c — Baseline (must work):**
- Test: IMG widget displaying pre-rendered PNG line strip
- Pass: Strip renders, correct Arabic, legible at 466px
- Measure: RAM per image, per-page build time
- Expected: **PASS** (this is RENDER-A, the default path)

**Pass Criterion (S2 overall):** Photographed evidence of all three variants on the real watch.

**Time Budget:** 2 hours

**Unblocks:** Batch G (Reader), Batch D (Data Layer asset pipeline)

**Note:** The project proceeds with RENDER-A regardless of S2 outcome. S2-a/S2-b are pure upside.

---

### S3 — Audio Capabilities
**Question:** Can a third-party mini-program play MP3s on Active 2?

**Pass Criterion:**
1. `@zos/media` creates a PLAYER and plays a local MP3 from watch FS
2. Playback survives closing the app UI (via `@zos/app-service` or background service)
3. A 20 MB file transfers from phone → watch in < 5 minutes

**Test Plan:**
```js
// In test app:
const player = hmSensor.createPlayer(hmSensor.id.PLAYER)
player.setSource(player.source.FILE, 'test.mp3')
player.prepare()
player.start()

// Close UI, check if audio continues
// Transfer 20 MB file, measure time
```

**Compare:**
- **AUDIO-A:** Our own MP3s + `@zos/media` + `@zos/ble` TransferFile
- **AUDIO-B:** MP3s in system music library (Zepp app's music transfer) + control-only app

**Pass Criterion for AUDIO-B:** Mini-program can drive system player; transfer is fast (bypasses BLE).

**Time Budget:** 2 hours

**Unblocks:** Batch M (Audio), F12 feature

**Failure Mode:** If either AUDIO-A or AUDIO-B fails → F12 is cut from v1 scope per PLAN.md §Batch M.

---

### S4 — Sensors (Compass + GPS)
**Question:** Do Compass and Geolocation work reliably on Active 2?

**S4-a — Compass:**
- `checkSensor(hmSensor.id.COMPASS)` returns true
- After calibration, bearing is stable ±5° over 30 seconds
- Calibration UX is usable (not impossible)

**S4-b — GPS:**
- `hmSensor.getGeolocation()` achieves `status === 'A'` (acquired)
- Cold fix outdoors: < 60 seconds
- Indoor behavior: documented (timeout or error code)

**Pass Criterion:** Log output from real device showing:
- Compass: `checkSensor() === true`, bearing values
- GPS: `status === 'A'`, lat/lon, fix time

**Time Budget:** 1 hour

**Unblocks:** Batch H (Prayer times), Batch J (Qibla)

**Failure Mode:**
- Compass fails → Qibla degrades to "point north + N degrees" text
- GPS fails → Manual city selection only, cached location warnings

---

### S5 — Budget (RAM + Package Size)
**Question:** What are the hard limits?

**S5-a — RAM:**
- Empty page: `process.memoryUsage().rss` or equivalent
- Per widget RAM: Add widgets one by one, measure delta
- Per image RAM: Load one 466×140 PNG, measure delta

**S5-b — Package Size:**
- `zeus build` → inspect output `.zab`/`.zpk` file size
- Find the limit: Incrementally add assets until build fails or upload rejects
- Check docs.zepp.com for published limit

**Pass Criterion:**
- Empty page RAM baseline: ___ KB
- Per widget RAM: ___ KB
- Per image RAM: ___ KB
- Package size limit: ___ MB (build error or documented value)

**Time Budget:** 1 hour

**Unblocks:** The whole performance budget in DESIGN-SYSTEM §8

**Failure Mode:** Package size < 30 MB requires aggressive asset culling → Juz 30 only for v1.

---

## Platform Risks (Document, Not Technical)

### Risk: API Level Mismatch (PRD says "Zepp OS 5", device has API 4.2)
**Impact:** All references to "Zepp OS 5" in documentation are incorrect.
**Mitigation:** Update PRD, PLAN, PROJECT-STATE to reflect API Level 4.0 or 4.2.
**Owner:** Documentation fix, not a spike.
**Status:** ⚠️ Requires Ahmed confirmation — is this a typo or unreleased firmware?

---

## Delivery Risks

### Risk: Model Inventing APIs
**Impact:** Silent breakage on device; wasted batches.
**Mitigation:** AGENTS.md allowlist + evidence rule. Only APIs from docs.zepp.com or template code.
**Status:** ✅ Mitigated by audit process

### Risk: Quran Text Corruption
**Impact:** Religious harm — incorrect ayat displayed.
**Mitigation:** Tanzil Uthmani source frozen; SHA-256 checksums; Ahmed's manual tashih at Batch D gate.
**Status:** ✅ Process defined (L-04, L-05 in PRD)

### Risk: Battery Drain
**Impact:** Users uninstall; app fails "premium" promise.
**Mitigation:** 24-hour battery test in Batch P; sensor stop in `onDestroy` mandated.
**Status:** ⚠️ Cannot verify until device testing

---

## Open Questions for Ahmed

1. **API Level:** Is "Zepp OS 5" a typo? The Active 2 only supports API 4.2.
2. **Compass:** Do you own this watch? Can you test S4?
3. **Audio:** Have you used the speaker? Can you test S3?
4. **Package size:** What's your upload limit in the Zepp developer console?

---

## SPIKES EXECUTION ORDER

**Critical path:** S1 → S5 → S4 → S2

**Parallel:** S3 (runs independently, but gates F12)

**Recommended:**
1. Run S1 first (if toolchain fails, stop)
2. Run S5 second (budget gates all design)
3. Run S4 third (sensors gate H/J batches)
4. Run S2 fourth (upside probe — timing flexible)
5. Run S3 anytime (audio decision gates M/F12)
