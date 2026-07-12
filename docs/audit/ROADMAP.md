# ROADMAP — Quran Premium

**Date:** 2026-07-12
**Based on:** PLAN.md batches A–P
**Updated:** Based on audit findings

---

## Batch Readiness Map

| Batch | Name | Status | Blocker | Notes |
|---|---|---|---|---|
| **0** | Architecture Audit | ✅ DONE | — | This document completes it |
| **S1** | Toolchain Smoke Test | ⬜ TODO | — | Must run before Batch A |
| **S2** | Arabic Rendering | ⬜ TODO | — | Upside probe only; RENDER-A is default |
| **S3** | Audio Capabilities | ⬜ TODO | — | Gates F12; parallel to other spikes |
| **S4** | Sensors (Compass/GPS) | ⬜ TODO | — | Gates H, J |
| **S5** | Budget (RAM/Size) | ⬜ TODO | — | Gates performance design |
| **A** | Skeleton | ⬜ TODO | S1, S5 | Needs toolchain + budget |
| **B** | Theme & Components | ⬜ TODO | A | Unblocked after A |
| **C** | Navigation Shell | ⬜ TODO | A | Unblocked after A |
| **D** | Data Layer | ⬜ TODO | A, S2 | Arabic pipeline decision from S2 |
| **E** | Home Dashboard | ⬜ TODO | B, C, D | Needs theme, nav, data |
| **F** | Surah Browser | ⬜ TODO | B, C, D | Unblocked after D |
| **G** | Quran Reader | ⬜ TODO | B, C, D, S2 | RENDER-A default; S2 is upside |
| **H** | Prayer Times | ⬜ TODO | D, S4 | Needs S4 verification |
| **I** | Tasbih | ⬜ TODO | B, C | Low dependency |
| **J** | Qibla | ⬜ TODO | B, C, S4 | Needs S4 compass data |
| **K** | Hisnul Muslim | ⬜ TODO | B, C, D | Low dependency |
| **L** | Bookmarks/Favorites | ⬜ TODO | B, C, D | Low dependency |
| **M** | Audio | ⬜ TODO | S3 | **Conditional on S3** |
| **N** | Settings | ⬜ TODO | B, C | Low dependency |
| **O** | Motion & Polish | ⬜ TODO | E–N | After all screens |
| **P** | Performance/Release | ⬜ TODO | O, S5 | Final budget verification |

---

## Critical Path (Minimum to First Working Build)

```
S1 → S5 → A → B → C → D → E → F → G
                         └→ H → J
                         └→ I, K, L, N
```

**Estimated time (spikes + Batch A-D):** ~2 weeks assuming spikes pass

---

## Parallel Tracks (After Batch D)

Once Data Layer (D) is merged, these can run in parallel across models:

| Track | Batches | Model | Effort |
|---|---|---|---|
| Core Screens | E, F, G | `clo` | high |
| Sensors | H, J | `cc-deep` | high |
| Data/Lists | I, K, L | `glm` | lo |
| Infrastructure | M, N | `glm` | lo |

**Note:** G waits for D (Quran data), H/J wait for S4, M waits for S3.

---

## Conditional Batches

### Batch M (Audio) — Conditional on S3
- **If S3 passes:** Proceed with Batch M as planned
- **If S3 fails:**
  1. Delete F12 from PRD.md scope
  2. Remove Home card 4 (Continue Audio) from design
  3. Write decision to `DECISIONS.md`
  4. No stub code — clean removal only

### Batch G (Reader) — Default Path Fixed
- **RENDER-A (default):** Proceed with line-strip PNGs per D-001
- **If S2-a passes (TEXT shaping):** Major redesign opportunity — much smaller package
- **If S2-b passes (CANVAS atlas):** Significant savings — whole Quran offline

**S2 is pure upside.** The project ships with RENDER-A regardless.

---

## PLAN.md Objections

### Objection 1: API Level "Zepp OS 5"
**PLAN.md Line 7:** "Target:** Amazfit Active 2 Round · 466×466 AMOLED · Zepp OS 5"

**Finding:** Device only supports API Level 4.2. Max available in toolchain is 4.4.

**Recommendation:** Update all references:
- PRD.md §1
- PLAN.md header
- PROJECT-STATE.md §Target

**Change to:** "Amazfit Active 2 Round · 466×466 AMOLED · API Level 4.2"

---

## Execution Order (Revised)

```
Phase 0 — Know before you build:
  ├─ Batch 0 (Audit) ✅ DONE
  ├─ S1 (Toolchain) ──────────────┐
  ├─ S5 (Budget) ────────────────┤
  └─ S4 (Sensors) ────────────────┼→ Must complete before Batch A
      S2 (Arabic, upside only) ───┘
      S3 (Audio, parallel) ────→ (anytime before M)

Phase 1 — Foundations:
  A (Skeleton) ──→ B (Theme) ──→ C (Nav) ──→ D (Data)

Phase 2 — Screens (parallel after D):
  ├─ E, F, G (Core Quran) → clo, high
  ├─ H, J (Sensors) → cc-deep, high
  ├─ I, K, L, N (Lists/Data) → glm, lo
  └─ M (Audio) → clo, high (if S3 passes)

Phase 3 — Finish:
  O (Polish) → P (Release)
```

---

## Model Routing (Confirmed from PLAN)

| Work | Model | Effort |
|---|---|---|
| Audit (Batch 0) | `clo` | high |
| Spikes S1–S5 | `cc-deep` | lo–high |
| Reader (Batch G) | `clo` | high |
| Audio (Batch M) | `clo` | high |
| Sensors (H, J) | `cc-deep` | high |
| Bulk screens (E, F, I, K, L, N) | `glm` | lo |
| Theme/Nav (B, C) | `glm` | lo |
| Polish/Release (O, P) | `glm/clo` | lo/xhigh |

---

## Immediate Next Steps

1. **Ahmed to verify:** Is "Zepp OS 5" a typo? Confirm API Level 4.2 is correct.
2. **Run S1** (30 min): Toolchain smoke test on real device
3. **Run S5** (1 hour): Budget measurements
4. **Update docs:** Fix API level references once confirmed

---

## Gate Criteria Summary

| Gate | Must Pass |
|---|---|
| 0 (Audit) | ✅ 4 reports exist; Ahmed reads "5 least sure" |
| S1 | TEXT widget renders on real Active 2 |
| S2 | Photos of 3 variants (TEXT, CANVAS, IMG) on device |
| S3 | Audio plays + survives UI close + transfer <5 min/20MB |
| S4 | Compass ±5°, GPS fix <60s |
| S5 | RAM baseline + package limit written |
| A | Builds, installs, empty black screen on device |
| B | No hardcoded hex outside theme.js; gallery ≤60 widgets |
| C | All pages reachable; right-swipe back works |
| D | Store survives reboot; **Ahmed's tashih LULUS** |
| E–N | Per-batch criteria in PLAN |
| P | Battery <4%/day; Ahmed's final LULUS |

---

## Timeline Estimate (Assuming Spikes Pass)

| Week | Work |
|---|---|
| 1 | S1, S5, S4, S2 (spikes) |
| 2 | Batch A (Skeleton) |
| 3 | Batch B (Theme) + Batch C (Nav) |
| 4 | Batch D (Data Layer) — **Ahmed's tashih gate** |
| 5-6 | Batch E, F, G (Core screens) |
| 7 | Batch H, J (Sensors) |
| 8 | Batch I, K, L, N (Support screens) |
| 9 | Batch M (Audio, if S3 passed) |
| 10 | Batch O, P (Polish + Release) |

**Total:** ~10 weeks to v1.0 from spike completion.

**Critical path:** S1/S5 → A → B → C → D (tashih gate) → E/F/G
