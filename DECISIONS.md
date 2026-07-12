# DECISIONS — Quran Premium

Newest entry on top.

---

## 2026-07-12 — Spike S2 — D-005 — Amiri Quran TTF upgrade (open, non-blocking)
**Context.** System font renders Uthmani correctly (S2 confirmed). Ahmed: "bisa tapi kalau bisa
Amiri TTF lebih bagus lagi."
**Choice.** System font is the shipped default. Amiri Quran (OFL, Google Fonts) tested as an
**optional upgrade** in a follow-up spike — if it works with the `font:` property, ship it.
If not, system font is already LULUS. **This does not block any batch.**
**Action.** Download `Amiri-Quran.ttf` (OFL) → `assets/<target>/fonts/` → test with
`font: 'fonts/Amiri-Quran.ttf'` on TEXT widget on the real watch. Compare side by side.

## 2026-07-12 — Spike S2 — D-001 — CLOSED — Arabic rendering = **RENDER-B (JSON + TEXT widget)**
**Context.** On-device photo (IMG_0626.PNG) proves:
- Letters join ✅ · RTL order ✅ · Harakat stacking ✅ · Shaddah+harakat combo ✅
- Hamzah ✅ · Alif washal ✅ (tashih pass by Ahmed)
- Three separate ayat all render correctly at 30–32px.
**Previous assumption.** RENDER-A (pre-shaped PNG line-strips, ~20–35 MB).
**New decision.** **RENDER-B: Quran text stored as JSON, rendered via TEXT widget at runtime.**
This means:
- **~2 MB JSON** for the entire 604-page mushaf instead of ~30 MB of images.
- Full Quran offline with no download packs needed.
- Native scroll, no image virtualization, no build pipeline for HarfBuzz.
- `tools/build-mushaf.mjs` changes from an image pipeline to a **JSON builder** (Tanzil
  Uthmani → structured JSON with surah/ayah/juz/page metadata + SHA-256 integrity check).
- The text is still **FROZEN** — JSON builder may parse and structure it, never edit a character.
**Consequence for PLAN.md:**
- Batch D simplifies: no HarfBuzz, no PNG strips, no image conversion pipeline.
- Batch G simplifies: reader = scrollable TEXT widgets, not image strips.
- `DESIGN-SYSTEM.md` §6 updated: RENDER-B is primary, RENDER-A demoted to historical note.
- Performance budget: widgets per page matters more now (TEXT vs IMG).
**Final.** Ahmed has spoken. This decision is locked.

## 2026-07-12 — Batch 0 — D-004 — Audio scope: per-surah packs on demand
*(unchanged from previous version)*

## 2026-07-12 — Batch 0 — D-003 — CLOSED — Audio F12 = GO (provisional)
*(unchanged — S3 still needs on-device verification of @zos/media)*

## 2026-07-12 — Batch 0 — D-002 — CLOSED — App name = **Quran Premium**
*(unchanged)*

## 2026-07-12 — Batch 0 — D-000 — Anchor documents adopted
*(unchanged)*
