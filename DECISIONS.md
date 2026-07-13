# DECISIONS — Quran Premium

Newest entry on top.

---

## 2026-07-14 — Batch B (P0 reader) — D-006 — Reader = windowed TEXT scroll, BUKAN SCROLL_LIST
**Context.** Master session P0 menyebut "SCROLL_LIST data_array" untuk ayat. Fakta di lapangan:
- `item_config` bentuk `{type:'TEXT', text: function(item)…}` yang dipakai batch-b adalah **API
  karangan** — tidak ada di `@zeppos/device-types` d.ts, tidak ada di docs. Inilah kelas bug
  paling mahal (AGENTS.md §0), dan tersangka utama kenapa reader tak pernah render.
- **Tidak ada satu repo pun di mesin ini yang membuktikan SCROLL_LIST** (`rg` ke quran-app,
  Quran-Amazfit, Quran-Mini, mahad-askar-app-v2 → nol pemakaian).
- SCROLL_LIST asli (docs) memakai `text_view` key-based + `item_height` FIX per `type_id`;
  wrap Arab multi-baris di dalamnya tidak terdokumentasi. Ayat 2:282 = 1218 char (~35 baris
  @size 32) tidak masuk pola item fix-height tanpa spike tersendiri.
- D-001 (LOCKED) sudah menetapkan RENDER-B: "reader = **scrollable TEXT widgets**, native scroll".
- Pola stacked-TEXT + `setLayerScrolling(true)` + `CLICK_DOWN` **terbukti jalan di watch ini**
  oleh `~/Projects/quran-app` (surah_view: 604 halaman mushaf, Arab wrap benar, difoto Ahmed).
**Options.** (a) SCROLL_LIST per docs — wrap & scroll-to unproven, gagal = blank lagi;
(b) stacked TEXT satu surah penuh — Al-Baqarah 286×2 widget, banned pattern #4 + scroll ~94.000px;
(c) **windowed stacked TEXT** — partisi ayat per window (est ≤2600px, max 20 ayat), native scroll
di dalam window, tombol ▲/▼ antar window, semua primitive proven.
**Choice.** (c). Tinggi ayat presisi via `getTextLayout` (d.ts:10240, verified) dengan fallback
estimasi kata (formula quran-app). Hasil partisi data real: Fatihah/Ikhlas/An-Nas = 1 window utuh;
Al-Baqarah = 42 window (max 12 ayat/window, est ≤2580px); 2:282 kebagian window sendiri + 1 tetangga.
**Consequence.** "Scroll mulus sampai ayat terakhir" berlaku penuh untuk surah pendek-menengah;
surah raksasa pindah window dengan 1 tap ▼ (model halaman mushaf, persis quran-app yang sudah
diterima Ahmed). `WIN_CAP`/`WIN_MAX` konstanta tunable setelah uji watch. Kalau mau continuous
scroll sungguhan utk 286 ayat → butuh spike SCROLL_LIST on-watch tersendiri (backlog).
**Bonus terkait.** (1) `app.json` permissions ditambah `device:os.local_storage` — quran-app yang
jalan mendeklarasikannya; tanpa ini `localStorage` (lastRead) berpotensi gagal diam-diam.
(2) `getSurahIndex()` pindah dari `require()` runtime (temuan #6, unverified) ke jalur
`openAssetsSync` yang sama dengan `getSurah`. (3) Basmalah pra-surah (kecuali 1 & 9) diambil dari
teks Al-Fatihah 1:1 milik data FROZEN — nol karakter Arab diketik tangan.

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
