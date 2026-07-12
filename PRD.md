# PRD — Quran Premium (Amazfit Active 2 Round · Zepp OS 5)

Status: **v1.0 draft, pre-audit.** Authoritative spec. Anything not written here is out of
scope until it is written here.

---

## 1. Product

A premium, offline-first Quran companion for the wrist: read, listen, pray on time, face the
qibla, and keep dzikir — with the visual quality of a luxury Islamic mushaf and the battery
manners of a native Zepp app.

**Reference workflow:** Quran Max M77 (familiar to users).
**Reference visual:** the approved 12-screen mockup — pure black, gold `#D4AF37`, emerald
`#0B6B4A`, rounded cards, Islamic geometric restraint.

### Naming — decide before Batch A
"Quran Max" is an existing third-party product name. Shipping under *Quran Max Premium*
invites a takedown from the Zepp store and muddies the brand Ahmed is actually building.
Recommended: a name in his own ecosystem — e.g. **Askar Quran**, **HafizhQ Watch**, or a
standalone **Nūr Mushaf**. The mockup's wordmark is a placeholder. (→ `DECISIONS.md` D-002)

## 2. Users

1. **The hafizh / thalib** — reads and revises Quran in gaps of time; wants the last-read
   position to be exactly where they left it, in one tap, with no phone.
2. **The praying Muslim** — wants prayer times that are correct for their location and madhab,
   a reliable adhan reminder on the wrist, and the qibla when travelling.
3. **The dzikir keeper** — wants a tasbih that counts with the wrist, not the eyes, and adhkar
   from a trustworthy source.

## 3. Locked decisions

| ID | Decision |
|---|---|
| L-01 | **Offline first.** Every core feature works with the phone off: reading, prayer times, qibla, tasbih, adhkar. The phone is only for *packs* (audio, extra mushaf pages) and settings. |
| L-02 | **Quran content is free, forever.** No ads, no paywall, no telemetry anywhere near the mushaf. "Premium" describes the craft, not a price tier. |
| L-03 | **Arabic is rendered from pre-shaped assets**, not from a runtime font, unless spike S2 proves the device shapes and stacks harakat correctly. (→ DESIGN-SYSTEM §6) |
| L-04 | **Quran text is FROZEN.** Source = Tanzil Uthmani (attribution kept, text never modified). Build fails on checksum mismatch. No model, at any point, may "fix" an ayah. |
| L-05 | **Fonts must be OFL** (Amiri Quran / Scheherazade New) or explicitly licensed. No scraped fonts. |
| L-06 | Default madhab **Shafi'i** (Asr = 1× shadow), default calculation **Kemenag Indonesia** (Fajr 20°, Isha 18°), default ihtiyat **+2 min**. All four are user-changeable. |
| L-06a | **Supported calculation methods:** Kemenag RI, JAKIM (Malaysia), Ummul Qura (Makkah), Egyptian General Survey, ISNA (North America), MWL (Worldwide), Tehran (Iran). |
| L-07 | The **right-swipe is the system back gesture** and is never intercepted outside a modal. |
| L-08 | One device target for v1: **Amazfit Active 2 Round, 466×466.** Square/Balance later, via `px()` + `designWidth`, not via a fork. |

## 4. Scope — v1.0

| # | Feature | Notes |
|---|---|---|
| F1 | Home dashboard | Continue Reading · Next Prayer · Tasbih · Continue Audio |
| F2 | Quran reader | Line-strip rendering, ayah nav, bookmark toggle, last-read persistence, juz/page indicator |
| F3 | Surah browser | 114 surahs, virtualised list, jump-to-surah, current-surah highlight |
| F4 | Prayer times | On-device calculation, 5 prayers, next-prayer countdown, per-prayer reminder, location cache + manual fallback |
| F5 | Tasbih | Ring counter, targets (33/99/100/1000/custom), haptics, persistence, presets |
| F6 | Qibla | Compass bearing to Kaaba (21.4225 N, 39.8262 E), calibration UX, graceful degrade |
| F7 | Hisnul Muslim | Morning / Evening / After Prayer / Protection — offline JSON from classical sources, with repeat counters |
| F8 | Bookmarks & Favorites | Add/remove/jump, empty states |
| F9 | Continue Reading screen | Big resume card with progress |
| F10 | Settings (watch) | Language, reciter, notifications, display, calc method, madhab, hijri offset |
| F11 | Settings App (phone) | Pack downloads, reciter choice, location override, calc method — heavy config lives here |
| F12 | Audio Quran | **Conditional on spike S3.** Local playback of downloaded surahs, background service, seek, speed. If S3 fails → the feature and its Home card are removed cleanly, not stubbed. |

## 5. Non-goals (v1)

Tafsir · translations of the Quran text · hadith library · streaming audio · social/sharing ·
accounts · analytics · watchface · voice recitation checking (that is Sima'i's job) ·
square-screen layout · ads of any kind.

## 6. Data model

```
assets/data/
  surah-index.json      114 × { id, nameAr, nameLatin, ayahCount, revelation, page, juz }
  page-index.json       604 × { page, juz, surahs[], lines[] }
  juz-index.json        30  × { juz, startSurah, startAyah, page }
  cities.json           50+ × { id, name, country, lat, lon, timezone } — major Muslim population centers
  adhkar/*.json         { id, category, titleId, lines[{ ar_img, translit?, id?, repeat }] }
  mushaf/               PNG line-strips, bundled subset (Juz 30 + 5 surahs) or full Quran (if 100 MB allows)
  fonts/                (only if S2 passes)
```

**Storage keys** (`@zos/storage` localStorage, all namespaced + versioned):

```
qp.settings.v1   { lang, reciter, calcMethod, madhab, ihtiyat, hijriOffset,
                   notify:{fajr..isha}, keepScreenOn, theme,
                   cityId }  // cityId for pre-bundled city fallback
qp.lastRead.v1   { surah, ayah, page, ts }
qp.bookmarks.v1  [{ surah, ayah, ts }]              max 200
qp.favorites.v1  [{ surah, ts }]                    max 114
qp.tasbih.v1     { count, target, preset, ts }
qp.location.v1   { lat, lon, city, ts, source:'gps'|'manual' }
qp.audio.v1      { surah, posPct, reciter }
qp.packs.v1      { mushaf:[juz…], audio:[surah…] }
```

Every read goes through `src/data/store.js` with a schema version and a migration function.
No page reads `localStorage` directly. Ever.

## 7. Quality bar (definition of "premium")

- Cold start to first paint **< 800 ms**; page transition **< 200 ms**.
- Reader scrolls at a steady frame rate with no visible strip pop-in.
- A full day of normal use costs **< 4 %** battery beyond baseline (measure it, don't assume).
- No sensor is ever left running after its page is destroyed.
- No screen is a dead end: every page has a way back, an empty state, and an error state.
- Nothing in the app ever displays a mis-shaped, mis-stacked, or truncated Quranic word. If it
  cannot be rendered correctly, it is not rendered at all.

## 8. Risks (owned, not hidden)

| Risk | Impact | Mitigation |
|---|---|---|
| No Arabic shaping on device | Kills the whole reader | Spike S2 first; RENDER-A (pre-shaped images) is the default plan |
| Package size limit | Can't bundle mushaf | Bundle a subset, download the rest via side-service |
| No speaker / no background audio | F12 dies | S3 before any audio UI is built; feature removed cleanly if it fails |
| GPS fix slow indoors | Wrong prayer times | Cache last fix, allow manual city, show the fix's age |
| Compass unavailable/uncalibrated | Wrong qibla — a religious harm, not a UX bug | Never show an uncalibrated bearing; degrade to "point north + N degrees" |
| Model invents a Zepp API | Silent breakage on device | AGENTS.md API allowlist + evidence rule + gate audits by `clo` |

## 9. Backlog ("andai ada" — not v1, do not build)

Watchface companion · square Active 2 target · tafsir tooltip · hifz revision scheduler synced
with HafizhQ · khatam tracker · multi-reciter A/B · Sima'i deep-link from the reader ·
Ramadan mode · adhan audio on the watch speaker.
