# AUDIT — Quran Premium

**Date:** 2026-07-12
**Auditor:** clo (Claude Code)
**Project:** Quran Premium — Amazfit Active 2 Round

---

## Ground Truth

### Environment
- **Node:** v26.4.0
- **npm:** v11.16.0
- **zeus-cli:** v1.9.1
- **zpm:** v3.4.1
- **Shell:** Fish (confirmed)
- **Zeus location:** `/home/cachymac/.npm-global/lib/node_modules/@zeppos/zeus-cli`

### Device Cache Status
- Cache file: `~/.zepp/.zeus_devices`
- Last updated: 2026-07-12 (via `zeus cache update`)
- Max API level available: **4.4** (not 5.x)

### Repo Status
```
Total size: 17M (docs only)
Git status: Many deleted files from previous project (app.js, assets/gt.r/data/*, etc.)
Latest commit: 88d6b4b "feat: Premium AMOLED Quran app — full feature build (phases 1-15)"
```

### Existing Code
**Case A — GREENFIELD**

This repo contains only documentation. No source code exists:
- No `app.json`
- No `package.json`
- No `src/`, `page/`, `app-side/`, `setting/` directories
- No assets (previous `assets/gt.r/` directory deleted)

---

## Device Target — CRITICAL FINDING

### PRD vs Reality
| Document | Value |
|---|---|
| PRD §1 | "Amazfit Active 2 Round · 466×466 AMOLED · **Zepp OS 5**" |
| Reality (device cache) | Amazfit Active 2 Round · 466×466 · **API Level 4.2** (range: 1.0-4.2) |

**Impact:** The project specification targets a platform version that does not exist in the official Zepp toolchain.

### Confirmed Device Details
From `~/.zepp/.zeus_devices` (deviceSource: **8913155** - MilanW variant):
```
productName: "Amazfit Active 2 (Round)"
deviceSource: 8913155
code: "MilanW"
shape: "round"
screen.size: "466*466"
os.apiLevel: "4.2"
os.apiLevelLimitMin: "1.0"
os.apiLevelLimitMax: "4.2"
```

**Recommendation:** Update all references from "Zepp OS 5" to "Zepp OS 4.x / API Level 4.2" or use API Level 4.0 (the highest stable version). The deviceSource for build targeting is **8913155**.

---

## Audit (Case A — Skip)

Not applicable — greenfield project.

---

## Frozen Files

**None yet.** The following will become frozen once Batch D completes:

1. `assets/data/surah-index.json` — Tanzil Uthmani surah metadata
2. `assets/data/page-index.json` — 604-page mushaf structure
3. `assets/data/juz-index.json` — 30 juz boundaries
4. `assets/mushaf/*.png` — Pre-rendered Quran line strips (if RENDER-A chosen)
5. `assets/fonts/*.ttf` — OFL-licensed Arabic fonts (if used)

**Rule:** Once these files exist and pass Batch D's gate, they are **FROZEN**. No batch may modify the Arabic text content. SHA-256 checksums will be enforced.

---

## SDK Type Declarations

**Status:** `@zeppos/device-types` is **NOT installed** locally or globally.

The zeus-cli does not bundle TypeScript declarations. API signatures must be verified against:
1. `docs.zepp.com` (official documentation)
2. Generated template projects (`zeus create`)
3. Runtime testing on actual device

**Implication:** The Capability Matrix will rely on template code inspection and official docs only. No type definitions are available to grep.

---

## Toolchain Commands Available

| Command | Purpose |
|---|---|
| `zeus create <name>` | Create new project with APP/WATCHFACE/WORKOUT_EXTENSION types |
| `zeus dev` | Development mode with simulator |
| `zeus preview` | Deploy to real device |
| `zeus build` | Production build |
| `zeus bridge` | Connect debugger/profiler |
| `zeus cache` | Update device cache |

**Available API Levels for `zeus create`:** 1.0, 2.0, 3.0, 3.5, 4.0

**App Types:** APP, WATCHFACE, WORKOUT_EXTENSION

**Shape Options:** round, square, bar

---

## Next Steps

1. Verify with Ahmed: Is "Zepp OS 5" a typo, or is there unreleased firmware?
2. Resolve device target before Batch A
3. Proceed to Capability Matrix for API verification
