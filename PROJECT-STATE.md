# PROJECT-STATE — Quran Premium

> First thing read every session. Last thing written every session. No exceptions — WIP commits too.

**Updated:** 2026-07-14 04:15  |  **Agent:** clo
**Repo:** `/home/cachymac/Projects/quran-premium`
**Target:** Amazfit Active 2 Round · 466×466 AMOLED · Zepp OS 5.17.0.1 · apiVersion 3.0.0

---

## Batch
**Batch B — P0 Reader Quran tampil penuh (master session 02) · ⏸ BERHENTI SESUAI PROTOKOL — MENUNGGU FOTO WATCH + TASHIH AHMED**

## Done (terbaru di atas)
- ✅ **P0 reader.js REWRITE TOTAL — windowed TEXT scroll (D-006).** SCROLL_LIST dibuang
  (API `item_config {type,text:fn}` terbukti karangan; lihat DECISIONS D-006). Sekarang:
  stacked TEXT + `setLayerScrolling(true)` — pola 1:1 dari `~/Projects/quran-app` yang
  terbukti di watch. Fitur: window partisi (est ≤2600px, max 20 ayat), nomor ayat gold
  `﴿ ٢ ﴾` di atas tiap ayat, ayat `C.textHi` size `F.quran` (32) WRAP CENTER, basmalah
  gold pra-surah (≠1, ≠9; teks diambil dari Fatihah 1:1 data FROZEN), ▲/▼ antar window,
  ◄/► prev-next surah (wrap 1↔114), ↩ back, lastRead (`qp.lastRead.v1`) disimpan saat
  buka/pindah window/pindah surah/onDestroy, buka dari params `{surahNum, ayahNum}`
  (JSON string ATAU object), tanpa params → lanjut lastRead (kartu "متابعة القراءة" di
  home langsung berfungsi).
- ✅ `zeus build` HIJAU + `zeus preview -t "Amazfit Active 2 (Round)"` SUKSES (QR expire
  2026-07-21). `reader.bin` + 115 JSON terverifikasi ada di dalam device.zip.
- ✅ Windowing diuji vs data real (Node): Fatihah/Ikhlas/An-Nas = 1 window utuh;
  Al-Baqarah = 42 window, max 12 ayat/window, semua ayat ter-cover, mapping benar.
- ✅ `app.json` permissions += `device:os.local_storage` (quran-app precedent; tanpa ini
  lastRead bisa gagal diam-diam).
- ✅ `getSurahIndex()` → baca `raw/data/quran/index.json` via `openAssetsSync` (jalur sama
  dgn `getSurah`), bukan `require()` runtime (temuan #6 lama ditutup).
- ✅ Gate hex: `rg "0x[0-9a-fA-F]{6}" page | grep -v theme.js` = KOSONG (tapZone → `C.bg`).
- ✅ Tidak ada timer/sensor di page manapun (satu-satunya `setInterval` di `src/ui/nav.js`
  = dead code tak di-import).
- ✅ (Sesi sebelumnya) UTF-8 decoder verified 114/114 vs Node; theme tokens `page/theme.js`;
  home dashboard 4 kartu; icon.

## Next step
**Ahmed:** jalankan `zeus preview -t "Amazfit Active 2 (Round)"` → scan QR → di watch uji
urutan ini: (1) Home → "متابعة القراءة" → harus muncul Al-Fatihah 7 ayat utuh; (2) tap ►
→ Al-Baqarah, scroll sampai bawah, tap ▼ beberapa kali (harus mulus, 42 window);
(3) dari Fatihah tap ◄ 3× → An-Nas → Al-Falaq → Al-Ikhlas 4 ayat utuh; (4) keluar app,
buka lagi → Continue harus mendarat di posisi terakhir; (5) **FOTO layar + tashih vs mushaf
cetak** (gate §5 MASIH TERBUKA — jalur render berubah). Baru setelah LULUS → lanjut P1 home final.

## Files touched
`page/reader.js` (rewrite) · `page/theme.js` (+F.quran 32, F.basmalah 28) ·
`src/data/quran.js` (getSurahIndex) · `app.json` (permissions) · `page/index.js` +
`page/surah-list.js` (tapZone C.bg) · `DECISIONS.md` (D-006) · `.gitignore` + hapus zab lama.

## Bugs
- **P1 — surah-list body kemungkinan besar BLANK di watch**: masih pakai SCROLL_LIST
  `item_config {type,text:fn}` karangan (sama dgn reader lama). Header + tombol side-nya
  hidup. Fix = rewrite pola windowed/proven saat P2. JANGAN kaget kalau list kosong saat
  uji P0 — jalur uji P0 tidak lewat sini (pakai Continue + ◄/►).
- **P2 — `src/ui/{layout,components,nav}.js` dead code** duplikat theme; hapus/rewire nanti.
- **P2 — `F.small` → `F.caption`** sudah beres sesi lalu; Amiri TTF belum ada (D-005 optional).

## Blockers
Tidak ada blocker teknis. Menunggu **verifikasi manual Ahmed di watch + tashih** (gate §5
terbuka: jalur render berubah — decoder UTF-8 + reader baru). Gate hanya ditutup oleh Ahmed.
