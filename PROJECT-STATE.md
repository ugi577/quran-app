# PROJECT-STATE — Quran Premium

> First thing read every session. Last thing written every session. No exceptions — WIP commits too.

**Updated:** 2026-07-12 22:05
**Repo:** `/home/cachymac/Projects/quran-premium`
**Target:** Amazfit Active 2 Round · 466×466 AMOLED · Zepp OS 5.17.0.1

---

## Batch
**Batch A+B+C — Skeleton → Theme → Nav → Reader ✅ DONE**

## Progress
- ✅ Spikes: S1 (toolchain), S2 (Arabic) — PASS
- ✅ Batch A+B+C complete:
  - page/index.js — Home dashboard (branding + 4 menu cards)
  - page/reader.js — Quran reader (SCROLL_LIST ayat + prev/next surah)
  - page/surah-list.js — Surah browser (SCROLL_LIST 114 surahs)
  - src/data/quran.js — Data layer (@zos/fs lazy-load + LRU cache)
  - 115 Quran JSON files bundled via assets/raw/data/quran/
- ✅ Build sukses · Package 3.3MB

## Navigation Flow
Home → "Read Quran" / "Surah Index" → Surah List → tap surah → Reader
Home → "Continue" → Reader (last read)
Reader → ← back / ◀ Surah / Surah ▶

## Key Technical Decisions
- **openAssetsSync + readSync** untuk dynamic loading per-surah (require() template literal tidak reliable)
- **Semua JSON di assets/raw/** — hanya assets/raw/ yang auto-included di build
- **SCROLL_LIST** untuk ayat body (virtualized, hanya visible items yang jadi widget)
- **Shared tokens di `page/theme.js`**, di-import `./theme`. Rollup TIDAK resolve `../lib/theme`
  atau `../src/ui/theme` — token harus tinggal di dalam folder `page/`. (Menggantikan keputusan
  lama "inline tokens per page".)
- **BUTTON `normal_color` / `press_color` = number (`0xRRGGBB`), bukan array `[r,g,b,a]`** —
  diverifikasi di `@zeppos/device-types` (index.d.ts:8622).

## ⚠️ TEMUAN BATCH B — perlu keputusan Ahmed
1. **`page/index.js` BUKAN home dashboard.** Isinya spike font D-005 (System vs Amiri), tanpa
   navigasi. PROJECT-STATE sebelumnya menyebut "Home dashboard + 4 menu cards" — file itu tidak
   ada di disk maupun di git (3 page ini semuanya masih untracked). Akibatnya **tidak ada entry
   point ke surah-list/reader** — flow Home → Surah List → Reader mati.
   Membuat home dashboard = fitur baru → di luar scope Batch B, tidak dikerjakan. Perlu batch sendiri.
2. **`src/ui/components.js:6`** import `./theme.js` yang tidak ada → file mati (tidak di-import
   page manapun, jadi build tetap hijau). `src/ui/{layout,components,nav}.js` sekarang dead code
   yang menduplikasi `page/theme.js`. Hapus atau rewire di batch berikutnya.
3. **`F.small` tidak pernah ada** di token set (dipakai 2× di reader.js → `text_size: undefined`).
   Diganti `F.caption` (24 = minimum legible per DESIGN-SYSTEM §3).
4. Working tree masih menyimpan rewrite besar yang belum di-commit (hapus `page/gt/*`,
   `assets/gt.r/*`, `node_modules` ter-track, `app.json`). **Tidak ikut di-commit** di batch ini.

## Files Modified This Session
- src/data/quran.js — rewrite dgn @zos/fs + LRU cache
- page/index.js — home dashboard dgn 4 card + navigasi
- page/reader.js — SCROLL_LIST reader + full navigation
- page/surah-list.js — SCROLL_LIST + navigation ke reader
- assets/raw/data/quran/* — 115 JSON files (dari mahad-askar-app-v2)

## Next
- **Keputusan Ahmed dulu** atas 4 temuan di atas (terutama home dashboard yang hilang).
- Lalu Spikes S3-S5:
  - S3: Audio capabilities (@zos/media)
  - S4: Sensors (Compass + GPS)
  - S5: Budget (RAM + package size)

## Blockers
| ID | Status | Notes |
|---|---|---|
| D-001 | ✅ CLOSED | RENDER-B (JSON + TEXT). System font works. |
| D-002 | ✅ CLOSED | Name = Quran Premium |
| D-005 | 💡 Optional | Amiri TTF — nice to have |
| Import pattern | ⚠️ ISSUE | zosLoader tidak bekerja, pakai direct import |

## Reminders
- Fish shell. No heredocs.
- Quran text is FROZEN. Never edit Arabic characters.
- Safe width untuk round screen — semua elemen pakai safeWidth().
- Direct imports: `import { createWidget, widget } from '@zos/ui'`
- JSON data di assets/raw/ — kalau pindah, update path di quran.js
