# PROJECT-STATE — Quran Premium

> First thing read every session. Last thing written every session. No exceptions — WIP commits too.

**Updated:** 2026-07-12 22:30
**Repo:** `/home/cachymac/Projects/quran-premium`
**Target:** Amazfit Active 2 Round · 466×466 AMOLED · Zepp OS 5.17.0.1

---

## Batch
**Batch B — Theme tokens + fix layar blank · ⏳ MENUNGGU VERIFIKASI DI WATCH**

## Penyebab layar blank (SUDAH DIPERBAIKI — `6618cf1`)
`app.json` = `apiVersion 4.0`. Di API_LEVEL 4.0, `createWidget` / `widget` / `align` /
`text_style` adalah **export modul `@zos/ui`, bukan global** (device-types hanya
mendeklarasikannya di `declare module '@zos/ui'`, index.d.ts:9652 — tidak ada `declare global`).
Ketiga page memakainya 26/33/29× **tanpa satu pun import** → `build()` melempar
`ReferenceError: createWidget is not defined` di widget pertama → tidak ada yang ter-render.

Rollup tidak mengeluh (identifier bebas bukan error saat bundling), jadi **build hijau ≠ page
hidup**. Theme refactor bukan penyebabnya — ia hanya menghijaukan page yang memang sudah mati.

> **Pelajaran:** build sukses bukan bukti apa pun di Zepp OS. Bukti = layar menyala di watch.

## Progress
- ✅ Spikes: S1 (toolchain), S2 (Arabic) — PASS
- ✅ Batch A+B+C complete:
  - page/index.js — **spike font D-005** (BUKAN home dashboard — lihat temuan #1)
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

## 🔴 GATE TASHIH TERBUKA LAGI (AGENTS.md §5) — `38207af`
`src/data/quran.js` men-decode aset dengan `String.fromCharCode` per byte = **latin1, bukan
UTF-8**. Huruf Arab UTF-8 itu 2 byte → tiap huruf pecah jadi dua karakter sampah:
`بِسْمِ` terbaca `Ø¨ÙØ³ÙÙÙ`. Jadi reader **tidak pernah** bisa menampilkan Arab yang benar.

Sudah diganti decoder UTF-8 eksplisit, **diverifikasi byte-exact terhadap decoder Node untuk
seluruh 114 surah** (114/114 PASS). Tidak ada karakter Arab yang diedit — hanya cara byte dibaca.

**Ahmed harus tashih sampel ayat vs mushaf cetak sebelum gate ditutup.** Jalur render berubah.

## ⚠️ TEMUAN BATCH B — perlu keputusan Ahmed
1. **`page/index.js` BUKAN home dashboard.** Isinya spike font D-005 (System vs Amiri), tanpa
   navigasi. PROJECT-STATE sebelumnya menyebut "Home dashboard + 4 menu cards" — file itu tidak
   ada di disk maupun di git (3 page ini semuanya masih untracked). Akibatnya **tidak ada entry
   point ke surah-list/reader** — flow Home → Surah List → Reader mati.
   Membuat home dashboard = fitur baru → di luar scope Batch B, tidak dikerjakan. Perlu batch sendiri.
2. **`src/ui/components.js:6`** import `./theme.js` yang tidak ada → file mati (tidak di-import
   page manapun, jadi build tetap hijau). `src/ui/{layout,components,nav}.js` sekarang dead code
   yang menduplikasi `page/theme.js`. Hapus atau rewire di batch berikutnya.
3. ✅ **`F.small` tidak pernah ada** di token set (dipakai 2× di reader.js → `text_size: undefined`).
   Sudah diganti `F.caption` (24 = minimum legible per DESIGN-SYSTEM §3).
5. **`assets/fonts/Amiri-Quran.ttf` TIDAK ADA** (`find assets -iname "*.ttf"` kosong), padahal
   `page/index.js:51` mereferensikannya. Separuh spike D-005 (System vs Amiri) tak bisa dijalankan.
   Kalau di watch hanya sebagian widget muncul, ini tersangkanya. Keputusan D-005, bukan Batch B.
6. **`getSurahIndex()` memakai `require('assets/raw/data/quran/index.json')`** — rollup TIDAK
   meng-inline JSON-nya; path itu tetap jadi string runtime di `reader.bin`/`surah-list.bin`.
   Apakah `require()` Zepp bisa memuat JSON aset saat runtime **belum terverifikasi**. Kalau
   surah-list blank/kosong padahal index page sudah hidup, mulai investigasi dari sini.
   (115 file JSON sendiri **sudah ikut terpaket** — dicek di dalam device.zip.)
4. Working tree masih menyimpan rewrite besar yang belum di-commit (hapus `page/gt/*`,
   `assets/gt.r/*`, `node_modules` ter-track, `app.json`). **Tidak ikut di-commit** di batch ini.

## Files Modified This Session
- src/data/quran.js — rewrite dgn @zos/fs + LRU cache
- page/index.js — home dashboard dgn 4 card + navigasi
- page/reader.js — SCROLL_LIST reader + full navigation
- page/surah-list.js — SCROLL_LIST + navigation ke reader
- assets/raw/data/quran/* — 115 JSON files (dari mahad-askar-app-v2)

## Next
1. **Scan QR → buka di watch.** Kriteria lulus: layar **tidak blank** — muncul "System Font:",
   ayat Bismillah, "D-005: Font comparison". Console tidak boleh ada `ReferenceError`.
2. **Tashih** teks Arab (gate §5 terbuka, lihat atas).
3. **Keputusan Ahmed** atas temuan #1 (home dashboard hilang → tidak ada entry point ke
   reader/surah-list) dan #5/#6.
4. Lalu Spikes S3-S5:
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
