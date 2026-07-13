# PROJECT-STATE — Quran Premium

> First thing read every session. Last thing written every session. No exceptions — WIP commits too.

**Updated:** 2026-07-14 04:15  |  **Agent:** clo
**Repo:** `/home/cachymac/Projects/quran-premium`
**Target:** Amazfit Active 2 Round · 466×466 AMOLED · Zepp OS 5.17.0.1 · apiVersion 3.0.0

---

## Batch
**Batch B — P0 Reader Quran tampil penuh (master session 02) · ⏸ FIX RONDE 2 TERKIRIM — MENUNGGU UJI ULANG WATCH + TASHIH AHMED**

## Done (terbaru di atas)
- 🔬 **RONDE 4 — b4 DIAGNOSIS (2026-07-14, `bd35ffd`):** b3 TERBUKTI terpasang (marker
  tampil) tapi reader tetap mati total; home hidup. Analisis graph import: satu-satunya
  modul di reader yang BELUM PERNAH terbukti load di watch = `src/data/store`
  (`@zos/storage`) — reader lama (tanpa store) pernah render side-buttons, surah-list
  lama (tanpa store) pernah render header, home (tanpa store) hidup sekarang. b4 =
  bisection satu ronde: (a) reader TANPA storage + flight recorder — marker `r-b4` kiri
  tengah + breadcrumb tahap (`load2`→`win`→`hdr`→`bsm`→`aN`→`ftr`→`ok`) + SEMUA exception
  dirender ke layar (`ERR @tahap: pesan`); (b) surah-list = host probe storage, menulis
  `b4 STORAGE OK (sX:aY)` / `b4 STORAGE ERR: …` di layar; kalau halamannya MATI TOTAL
  (probe tak muncul) = import @zos/storage fatal di runtime. v1.0.2 code 3. Verified:
  `b4` ada di ketiga page .bin, `code:3` di zpk. **Matriks vonis di ## Bugs.**
- ✅ **RONDE 3 — HIPOTESIS CACHE INSTALL (2026-07-14):** uji ronde 2 Ahmed = SEMUA layar
  identik piksel ("sprt tdk ada perubahan") → watch diduga kuat masih menjalankan paket
  LAMA. Zepp App men-cache install per appId+version dan version TIDAK PERNAH di-bump
  sepanjang batch-b → kemungkinan semua uji touch berhari-hari kemarin menguji build basi.
  FIX: version → **1.0.1 / code 2** + **penanda build `BUILD='b3'`** (theme.js) dirender
  di bawah home. Verified dalam paket: manifest 1.0.1, code:2 di 7 zpk, string `b3` ada
  di `index.bin`. **Protokol baru: layar home TANPA tulisan `b3` = install basi, uji
  tidak sah.** Tiap ronde preview berikutnya WAJIB bump BUILD + version code.
- ✅ **FIX RONDE 2 (dari uji watch Ahmed 2026-07-14):** gejala "Baqarah blank total +
  Fatihah muncul 1-2x lalu blank" terdiagnosis sebagai SATU rantai: (a) `utf8Decode`
  lama push 1-char-string per karakter → ~190rb string JS utk 2.json 197KB → heap
  meledak → OS bunuh page sebelum paint = blank; (b) `gotoReader` nulis lastRead
  SEBELUM render → begitu tap ► ke Baqarah, lastRead=2 keracunan → Continue selalu
  mendarat di surah yang crash → "Fatihah hilang". FIX: decoder chunked
  (`fromCharCode.apply` per 4096 unit, pipeline proven quran-app; re-verified
  **115/115 byte-exact vs Node**, 2.json 1ms) + lastRead HANYA ditulis setelah build
  sukses (`_renderedOK`), error path dapat chip recovery ke Fatihah. Rebuild + QR baru
  (expire 2026-07-21 04:27). Foto Ahmed = surah-list (divider 243px + ⌂ tofu ☐ + ↩
  emoji), BUKAN reader — konsisten dgn prediksi list body blank (P2).
- ℹ️ **Tasbih + Settings di home BUKAN bug** — placeholder by design (P1 spec master
  session: "Tasbih & Settings placeholder"), tap-nya memang belum ke mana-mana.
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
**Ahmed (b4 = ronde diagnosis, butuh 2 FOTO):** (1) hapus app dari watch → scan QR baru
→ home harus tulis `b4`; (2) **FOTO 1:** tap **القرآن الكريم** (surah-list) → foto layar
— yang dicari: baris `b4 STORAGE OK/ERR …` di tengah-bawah, ATAU halaman mati total;
(3) **FOTO 2:** balik ke home, tap **متابعة القراءة** (reader) → foto layar — yang
dicari: teks kecil `r-b4 <tahap>` di kiri-tengah + kalau ada, kotak `ERR @…`.
Interpretasi cepat: reader hidup normal = storage-lah tersangkanya (b5 pasang balik
dgn guard); reader tampil `ERR @tahap` = akar persisnya ketahuan; `r-b4 aN` beku tanpa
ERR = crash native di ayat N; surah-list mati total = import @zos/storage fatal.

## Files touched
`page/reader.js` (rewrite) · `page/theme.js` (+F.quran 32, F.basmalah 28) ·
`src/data/quran.js` (getSurahIndex) · `app.json` (permissions) · `page/index.js` +
`page/surah-list.js` (tapZone C.bg) · `DECISIONS.md` (D-006) · `.gitignore` + hapus zab lama.

## Bugs
- **P1 — surah-list body BLANK di watch (TERKONFIRMASI foto 2026-07-14)**: SCROLL_LIST
  `item_config {type,text:fn}` karangan + judul lebar 0 (`safeWidth(18,48)`=0, terlalu
  dekat tepi) + glyph `⌂` = tofu ☐ di font sistem (JANGAN pakai ⌂ lagi; ↩ render sebagai
  emoji — jelek tapi jalan). Fix = rewrite pola proven saat P2.
- **Hipotesis cadangan kalau Baqarah MASIH blank setelah fix decoder** (urutan cek):
  (a) `getTextLayout` di QJSC device return aneh utk string 1218 char → paksa fallback
  estimasi (hapus try-block utk uji); (b) TEXT widget h>~1800px tidak didukung → pecah
  ayat panjang jadi beberapa TEXT; (c) JSON.parse 197KB kelamaan → pindah parse ke
  timeout/split file. Jangan tebak — minta console log `zeus dev` dulu.
- **P2 — `src/ui/{layout,components,nav}.js` dead code** duplikat theme; hapus/rewire nanti.
- **P2 — `F.small` → `F.caption`** sudah beres sesi lalu; Amiri TTF belum ada (D-005 optional).

## Blockers
Tidak ada blocker teknis. Menunggu **verifikasi manual Ahmed di watch + tashih** (gate §5
terbuka: jalur render berubah — decoder UTF-8 + reader baru). Gate hanya ditutup oleh Ahmed.
