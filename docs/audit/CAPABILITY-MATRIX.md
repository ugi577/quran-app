# CAPABILITY MATRIX — Quran Premium

**Date:** 2026-07-12
**Device:** Amazfit Active 2 Round (deviceSource: 8913155)
**API Level:** 4.2 (max 4.2, not 5.x as PRD states)

---

## Legend
- **✅ CONFIRMED** – Evidence exists (docs.zepp.com URL or template code)
- **❓ UNKNOWN** – No evidence found → becomes a spike
- **⚠️ PARTIAL** – Exists but with caveats/limitations
- **🚫 BLOCKED** – Confirmed unavailable → design change required

---

| # | Capability | Module / API | Status | Evidence | Risk | Fallback if unavailable |
|---|---|---|---|---|---|---|
| 1 | Build & install to real device | `@zeppos/zeus-cli` (`zeus build`, `zeus preview`) | ✅ CONFIRMED | Toolchain installed, `zeus --version` returns v1.9.1 | Low | None — must work |
| 2 | **Target device key for Amazfit Active 2 Round** | `app.json` → `deviceSource` | ✅ CONFIRMED | Device cache: deviceSource=**8913155** (MilanW variant) | Low | None — hardcoded target |
| 3 | **Screen resolution: 466×466 round** | `app.json` → `designWidth` | ✅ CONFIRMED | Device cache: `screen.size: "466*466"`, shape: round | Low | `px()` from `@zos/utils` for scaling |
| 4 | **API Level 4.2 vs Zepp OS 5 discrepancy** | `app.json` → `apiVersion` | ⚠️ PARTIAL | PRD says "Zepp OS 5" but device only supports API 4.2 (max 4.4 in toolchain) | **HIGH** | Use API 4.0 or 4.2; update PRD/PLAN |
| 5 | Widgets: TEXT, IMG, FILL_RECT, ARC, CIRCLE, GROUP, SCROLL_LIST | `@zos/ui` | ✅ CONFIRMED | docs.zepp.com/ui-reference — standard widgets for Zepp OS 4.x | Low | None — core UI primitives |
| 6 | CANVAS widget for glyph-atlas rendering | `@zos/ui` → `CANVAS` | ❓ UNKNOWN | **SPIKE S2-b** — verify `drawImage` performance on 466×466 | Medium | Use RENDER-A (line strips) instead |
| 7 | **Arabic shaping via TEXT widget** | `@zos/ui` → TEXT with custom font | ❓ UNKNOWN | **SPIKE S2-a** — Zepp OS has no documented Arabic shaping engine | **HIGH** | RENDER-A (pre-shaped images) is default |
| 8 | Custom TTF bundling (Amiri Quran / Scheherazade New) | Build process + `@zos/ui` TEXT | ❓ UNKNOWN | **SPIKE S2-b** — font may be subsetted or rejected by build | Medium | Use RENDER-A (images) instead |
| 9 | SCROLL_LIST for 114 surahs (virtualized) | `@zos/ui` → SCROLL_LIST | ✅ CONFIRMED | docs.zepp.com/list-component — `data_array` pattern | Low | Manual pagination (max 60 widgets/page) |
| 10 | Gestures / swipe (system back) | `@zos/interaction` → `onGesture` | ✅ CONFIRMED | docs.zepp.com/interaction-events | Low | Button-based back |
| 11 | Routing (push/replace/back) | `@zos/router` | ✅ CONFIRMED | docs.zepp.com/page-routing | Low | Manual page stack in state |
| 12 | Key-value storage (`localStorage`) | `@zos/storage` | ✅ CONFIRMED | docs.zepp.com/local-storage | Low | None — essential for offline |
| 13 | File system read/write | `@zos/fs` | ✅ CONFIRMED | docs.zepp.com/file-system | Low | Bundle everything in package |
| 14 | Haptics / vibration | `@zos/sensor` → `Vibrator` | ✅ CONFIRMED | docs.zepp.com/vibration | Low | Visual feedback only |
| 15 | **Compass for Qibla bearing** | `@zos/sensor` → `Compass` | ❓ UNKNOWN | **SPIKE S4** — verify `checkSensor(Compass)` on real Active 2 | **HIGH** | "Point north + N degrees" text fallback |
| 16 | **GPS for prayer times** | `@zos/sensor` → `Geolocation` | ✅ CONFIRMED | docs.zepp.com/geolocation | Medium | Manual city selection + cached location |
| 17 | Time & timezone | `@zos/sensor` → `Time` | ✅ CONFIRMED | docs.zepp.com/time | Low | None — always available |
| 18 | **Speaker presence on Active 2** | Hardware capability | ⚠️ PARTIAL | Ahmed confirms speaker exists, but **SPIKE S3** must confirm mini-program access | **HIGH** | Remove F12 (Audio) if failed |
| 19 | **Audio playback of local MP3** | `@zos/media` → `create(id.PLAYER)` | ❓ UNKNOWN | **SPIKE S3** — verify `setSource(player.source.FILE)` works | **HIGH** | Remove F12 if failed |
| 20 | **Phone→watch file transfer (audio packs)** | `@zos/ble` → `TransferFile` + side-service | ❓ UNKNOWN | **SPIKE S3** — measure throughput for 20-35 MB packs | Medium | Smaller initial bundle (Juz 30 only) |
| 21 | **Background execution (audio, prayer alarms)** | `@zos/app-service` | ⚠️ PARTIAL | docs.zepp.com/background-service — **API has strict limitations** | **HIGH** | Foreground-only audio; alarms via `@zos/alarm` |
| 22 | Scheduled wakeup / adhan reminders | `@zos/alarm` | ✅ CONFIRMED | docs.zepp.com/alarm | Low | None — essential for prayer times |
| 23 | System notifications | `@zos/notification` | ✅ CONFIRMED | docs.zepp.com/notification | Low | In-app alerts only |
| 24 | Screen-on while reading | `@zos/display` → `setPageBrightTime`, `pauseDropWristScreenOff` | ✅ CONFIRMED | docs.zepp.com/brightness | Low | User taps periodically |
| 25 | Settings App on phone | `setting/index.js` | ✅ CONFIRMED | Template creates this with `--withSettings` flag | Low | All settings on-watch (less ideal) |
| 26 | i18n (incl. `id-ID` locale) | `@zos/i18n`, `.po` files | ✅ CONFIRMED | docs.zepp.com/multilingual | Low | Hardcode strings (not ideal for global) |
| 27 | **Package size limit for .zab/.zpk** | Platform constraint | ❓ UNKNOWN | **SPIKE S5** — actual limit not documented; measure via `zeus build` | **HIGH** | Aggressive asset culling, download model |
| 28 | appId: numeric, issued by Zepp | `app.json` → `appId` | ✅ CONFIRMED | Generated by `zepp create`, must be registered in Zepp console | Low | Development mode (unsigned) |

---

## Summary by Status

**CONFIRMED (19):** Core toolchain, routing, storage, basic UI, notifications, alarms, time, i18n, Settings App

**UNKNOWN (6):** Arabic shaping (S2), CANVAS drawImage (S2-b), Compass (S4), Audio access/playback (S3), TransferFile throughput (S3), Package size limit (S5)

**PARTIAL (3):** API Level mismatch (5 vs 4.2), Speaker hardware vs software access, Background service limitations

---

## Risk Triage

**Critical (blocks project without workaround):**
- Arabic shaping (S2) — Solved by D-001 (RENDER-A default)
- API Level mismatch — Document fix, not technical
- Package size limit (S5) — Design depends on this

**High (major feature at risk):**
- Compass (S4) — Qibla depends on this
- Audio (S3) — F12 depends on this
- Background execution — Audio + alarms depend on this

**Medium (UX/performance impact):**
- GPS time-to-fix — Cached location fallback
- TransferFile throughput — Smaller initial bundle

**Low (nice-to-have):**
- Haptics — Can fall back to visual
- Screen-on — Can require periodic taps
