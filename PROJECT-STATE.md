# PROJECT-STATE — Quran Premium

> First thing read every session. Last thing written every session. No exceptions — WIP commits too.

**Updated:** 2026-07-14 04:15  |  **Agent:** clo
**Repo:** `/home/cachymac/Projects/quran-premium`
**Target:** Amazfit Active 2 Round · 466×466 AMOLED · Zepp OS 5.17.0.1 · apiVersion 3.0.0

---

## Batch
**Batch B — P0 Reader Quran tampil penuh (master session 02) · ⏸ FIX RONDE 2 TERKIRIM — MENUNGGU UJI ULANG WATCH + TASHIH AHMED**

## Done (terbaru di atas)
- ✅ **RONDE 5 — b5 FIX BERBASIS VONIS b4 (2026-07-14, `c73be5a`):** Foto b4 Ahmed =
  breakthrough: (1) **READER RENDER SEMPURNA** — Fatihah utuh, Arab benar, nomor gold
  ﴿ ٧ ﴾, wrap rapi → arsitektur D-006 TERBUKTI; (2) probe = `STORAGE ERR: TypeError:
  not a function` → instance `localStorage` tidak ada di runtime 3.0; pakai **class
  `new LocalStorage()`** (d.ts @version 3.0). Kematian b3 terjelaskan: storeGet melempar
  di onInit + console.error di catch bukan fungsi. b5: store.js backend class→instance→
  no-op (TIDAK PERNAH melempar) + getBackendName(); console.log-only seluruh repo;
  **glyph tofu dari foto (◄ ► ⌂ = ☐) diganti kata Arab** السابقة/التالية/تابع/أعلى;
  tombol keluar reader = replace ke home (back() setelah rantai replace tak berfungsi —
  laporan Ahmed); lastRead aktif lagi. AGENTS §2 storage + banned #13/14/15 baru;
  DECISIONS D-007. v1.0.3 code 4; b5 verified di 3 bin (catatan: literal Arab di
  bytecode QJSC = UTF-16LE, grep UTF-8 tidak akan ketemu — cek pakai Buffer utf16le).
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
**Ahmed (b5):** hapus app → scan QR → home tulis `b5` → uji: (1) **القرآن الكريم** →
probe harus tulis `b5 STORE[class] OK s1:a1` (foto); (2) **متابعة القراءة** → Fatihah;
(3) chip **التالية** → Al-Baqarah render + **تابع** turun beberapa window + **أعلى**
naik; (4) chip **↩** → harus balik ke HOME (bukan diam); (5) keluar app (swipe kanan),
buka lagi → Continue mendarat di posisi terakhir (lastRead JALAN pertama kalinya);
(6) ke Al-Ikhlas (السابقة 3× dari Fatihah) → 4 ayat utuh; (7) **FOTO + TASHIH vs mushaf
cetak** — Fatihah foto b4 sudah terlihat benar, tapi gate §5 butuh pernyataan LULUS
eksplisit Ahmed utk sampel lebih luas (min. Fatihah + awal Baqarah + Ikhlas).
LULUS semua → Batch B P0 GATE DITUTUP → lanjut P1 (home final).

## Files touched (kumulatif P0 ronde 1–5)
`page/reader.js` (rewrite D-006 + flight recorder + chip kata Arab + lastRead 2-lapis) ·
`page/theme.js` (F.quran 32, F.basmalah 28, BUILD marker) · `page/index.js` (marker
BUILD di home, tapZone C.bg) · `page/surah-list.js` (probe storage + tapZone C.bg) ·
`src/data/quran.js` (decoder UTF-8 chunked — verified 115/115, getSurahIndex via fs,
console.log-only) · `src/data/store.js` (backend class→instance→no-op, tak pernah
melempar, getBackendName) · `app.json` (permission local_storage; version 1.0.3 code 4) ·
`AGENTS.md` (§2 storage row; banned #13 console, #14 glyph, #15 bump marker) ·
`DECISIONS.md` (D-006 reader windowed TEXT, D-007 storage/console/glyph) · `.gitignore`.

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
