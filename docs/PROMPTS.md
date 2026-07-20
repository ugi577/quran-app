# PROMPT PACK — copy, paste, run

Every prompt assumes the model is in `/home/cachymac/Projects/quran-premium` and reads
`AGENTS.md` + `docs/context/PROJECT-STATE.md` first. Run them **in order**; never start a batch
whose gate dependency has not passed.

---

## 0 — Universal session opener (any model, any time)

```
Baca AGENTS.md, docs/context/PROJECT-STATE.md, docs/PLAN.md.
Lanjutkan batch aktif dari langkah pertama yang belum selesai.
Shell = Fish (JANGAN heredoc), tulis file via file tool.
Jangan pakai API Zepp yang belum kamu verifikasi di
node_modules/@zeppos/device-types atau docs.zepp.com — kalau ragu, tulis
UNKNOWN dan berhenti, jangan menebak.
Jangan install dependency atau refactor di luar PLAN.
Commit kecil per sub-langkah. Kalau limit/blocker: commit WIP, isi
PROJECT-STATE (Batch/Progress/Next step/Files touched/Blocker), berhenti.
```

## Batch 0 — Audit  ·  `clo`, high
Paste `docs/prompts/00-AUDIT.md` verbatim. No code comes out of this session.

---

## Spikes  ·  `cc-deep`, high  ·  all code lives in `spikes/`, never in `src/`

**S1 — toolchain**
```
SPIKE S1 (throwaway code, folder spikes/s1-toolchain/).
Goal: prove the toolchain reaches the real Amazfit Active 2 Round.
Steps: zeus create a minimal APP; set the target from docs/audit/CAPABILITY-MATRIX.md
(NOT from memory); build; install via zeus preview; render one TEXT widget.
Deliver: spikes/s1-toolchain/RESULT.md = exact target key + deviceSource + zeus
version + node version + the commands that worked + a photo of the watch.
Do not touch src/ or page/.
```

**S2 — ARABIC RENDERING (the project's gatekeeper)**
```
SPIKE S2 (spikes/s2-arabic/). This decides the entire Quran reader architecture.
Build ONE page on the real watch showing the same ayah (Al-Baqarah 2:2, Uthmani,
with harakat) rendered four ways, stacked:
  A. TEXT widget, system font, raw Uthmani string.
  B. TEXT widget + bundled OFL Quran TTF (Amiri Quran) via the `font:` property.
  C. TEXT widget + that TTF, but the string pre-converted OFFLINE to Arabic
     Presentation Forms and reversed into visual order.
  D. IMG widget showing a PNG strip rasterised OFFLINE (HarfBuzz shaping + the same
     font, white on transparent, 400px wide).
For each: photograph the WATCH (not the simulator) and answer, honestly:
  - do the letters join?
  - is every harakat stacked on its correct base letter?
  - is the word order right (RTL)?
  - is it legible at arm's length?
Also measure for D: bytes on disk, RAM while displayed, ms to build the widget.
Deliver spikes/s2-arabic/RESULT.md with a clear recommendation: RENDER-A (images)
or RENDER-B (font). Do not implement the reader. Do not "fix" the Arabic text —
if a variant renders it wrong, that is the finding.
```

**S3 — audio**
```
SPIKE S3 (spikes/s3-audio/). Answer, on the real device:
1. Does the Active 2 Round have a usable speaker from a mini program?
2. Does @zos/media play a 64 kbps mono MP3 from the watch filesystem?
3. Does playback survive closing the app UI, via @zos/app-service?
4. How long does @zos/ble TransferFile take to move 5 MB from the phone?
5. How many MB of audio can realistically live on the watch?
Deliver RESULT.md with numbers and a GO / NO-GO for PRD feature F12.
NO-GO is a perfectly acceptable answer — say so plainly rather than half-proving it.
```

**S4 — sensors**  ·  **S5 — budget**
```
SPIKE S4 (spikes/s4-sensors/): checkSensor(Compass) and checkSensor(Geolocation) on
the real watch; compass drift over 60 s; calibration behaviour; cold GPS fix time
indoors vs outdoors; battery cost of 5 min of each. Deliver RESULT.md.

SPIKE S5 (spikes/s5-budget/): RAM of an empty page; RAM per TEXT/IMG/FILL_RECT
widget; RAM of one 400×96 PNG strip; the largest package the platform will accept.
Deliver RESULT.md — these numbers become the performance budget.
```

---

## Batch A — Skeleton  ·  `cc-deep`, lo
```
Kerjakan Batch A di docs/PLAN.md (skeleton + app.json + folder contract + build).
Target device & deviceSource: ambil dari docs/audit/CAPABILITY-MATRIX.md, JANGAN
dari ingatan. designWidth 466. Permissions: hanya yang benar-benar dipakai.
Jangan tambah dependency di luar yang tertulis di PLAN.
Selesai = `zeus build` sukses DAN halaman kosong tampil hitam di watch asli.
Update PROJECT-STATE, commit per sub-langkah.
```

## Batch B — Theme & components  ·  `glm`, lo
```
Kerjakan Batch B di docs/PLAN.md.
docs/DESIGN-SYSTEM.md adalah SATU-SATUNYA sumber warna, ukuran, radius, spacing.
Kalau kode dan DESIGN-SYSTEM beda, DESIGN-SYSTEM yang menang.
Wajib: src/ui/theme.js, layout.js (safeWidth/centerX persis seperti di §1),
components.js (Header, Card, ListRow, IconButton, PillButton, ProgressBar,
RingProgress), icons.js, page/dev-gallery.js.
DILARANG: hex mentah di luar theme.js; lebar card yang di-hardcode; melewati
safeWidth(); menambah komponen yang tidak diminta.
Gate B: `rg -n "0x[0-9a-fA-F]{6}" src page | grep -v theme.js` harus KOSONG, dan
gallery tampil di watch asli tanpa ada elemen yang kepotong bezel.
```

## Batch C — Navigation  ·  `glm`, lo
```
Kerjakan Batch C (page registry, src/ui/nav.js di atas @zos/router, BasePage yang
menjamin onDestroy menghentikan SEMUA timer & sensor, press feedback + haptic,
transisi ≤ 200 ms).
DILARANG KERAS: meng-intercept GESTURE_RIGHT (itu tombol back sistem).
Bukti untuk gate: satu baris log per page destroy yang membuktikan timer & sensor
berhenti. Jangan sentuh src/ui/theme.js.
```

## Batch D — Data layer + mushaf pipeline  ·  `cc-deep`, high
```
Kerjakan Batch D. Ikuti keputusan D-001 di docs/DECISIONS.md (RENDER-A atau
RENDER-B — hasil spike S2). Kalau D-001 belum ada, BERHENTI dan bilang.
Bangun: src/data/store.js (namespaced qp.*, versioned, satu-satunya pintu ke
localStorage, punya fungsi migrasi), src/data/quran.js (index surah/juz/halaman,
lazy load per surah, LRU cache), tools/build-mushaf.mjs (Tanzil Uthmani →
shaping HarfBuzz → PNG line-strip + manifest + SHA-256 teks sumber).
ATURAN MUTLAK: teks Uthmani FROZEN. Pipeline boleh membentuk & meraster, TIDAK
BOLEH mengubah satu karakter pun. Build gagal kalau checksum tidak cocok.
Bundle: Juz 30 + Al-Kahf, Yasin, Ar-Rahman, Al-Waqi'ah, Al-Mulk.
Gate D butuh tashih manual Ahmed (20 ayat vs mushaf cetak) — siapkan sheet
kontaknya, jangan tutup gate sendiri.
```

## Batch E — Home  ·  `glm`, lo
```
Kerjakan Batch E: page/home.js sesuai DESIGN-SYSTEM §7.1 (4 kartu: Continue
Reading, Next Prayer + countdown, Tasbih, Continue Audio).
Semua data lewat src/data/*, tidak ada localStorage langsung, tidak ada angka
dummy yang tertinggal. Kartu Continue Audio DISEMBUNYIKAN kalau F12 = NO-GO (cek
DECISIONS). Hanya 1 timer 1 Hz di seluruh halaman (jam + countdown), berhenti di
onDestroy. Target: first paint < 800 ms.
```

## Batch F — Surah browser  ·  `glm`, lo
```
Kerjakan Batch F: page/surah-list.js, DESIGN-SYSTEM §7.3.
WAJIB SCROLL_LIST dengan data_array + item_click_func. 114 widget manual =
langsung ditolak di gate. Nama surah Arab = aset gambar, bukan font.
Tambah jump-to-surah (input angka, bukan keyboard). Highlight surah aktif.
```

## Batch G — Quran reader  ·  `clo`, high  ·  ← jantung aplikasi
```
Sesi Batch G (reader). Baca docs/audit/*, DECISIONS D-001, DESIGN-SYSTEM §6 & §7.2.
Bangun renderer line-strip ter-virtualisasi: hanya strip yang terlihat yang hidup,
sisanya dihancurkan; maksimum 8 gambar hidup; tanpa pop-in saat scroll.
Fitur: navigasi ayat (tombol, bukan swipe), toggle bookmark, tulis-balik lastRead
di onDestroy, indikator juz/halaman, opsi keep-screen-on.
Kalau ada satu ayat pun yang render-nya meragukan: TAMPILKAN KOSONG + laporkan.
Jangan pernah "memperbaiki" teks Arab.
Gate G butuh foto watch asli + tashih Ahmed.
```

## Batch H — Prayer times  ·  `cc-deep`, high
```
Kerjakan Batch H. Hitung sendiri di device (tanpa library eksternal):
deklinasi matahari + equation of time; metode: Kemenag (default, Fajr 20°/Isha 18°),
MWL, Umm al-Qura, Egypt, Karachi; madhab Asr Syafi'i (default) / Hanafi; ihtiyat
(default +2 menit); konversi Hijriah + offset ±1 hari.
Lokasi: GPS → cache (qp.location.v1) → manual. Tampilkan umur fix kalau > 24 jam.
Pengingat: @zos/alarm, di-arm ulang harian oleh @zos/app-service.
Gate H: cocokkan dengan referensi tepercaya untuk 3 kota × 3 tanggal, selisih ≤ 1
menit. Tulis tabel hasilnya di PR. Kalau meleset, itu bug — jangan digeser dengan
menambah ihtiyat.
```

## Batch I / J / K / L / N  ·  `glm` (J → `cc-deep`), lo
```
Batch I (Tasbih, §7.6): ring = 1 gambar + 1 ARC (BUKAN 33 widget). Seluruh area
atas = zona tap +1. Haptic: short-strong per hitungan, long-strong saat target.
Hitungan bertahan setelah restart.

Batch J (Qibla, §7.7, cc-deep): bearing ke Ka'bah (21.4225, 39.8262) dari lat/lon;
jarum = qiblaBearing − heading. JANGAN PERNAH menampilkan bearing saat kompas
belum terkalibrasi — tampilkan panduan kalibrasi. Tanpa kompas: degrade, jangan
crash. Ini soal ibadah, bukan UX: lebih baik tidak menampilkan apa pun daripada
menampilkan arah yang salah.

Batch K (Hisnul Muslim, §7.8): 4 kategori dari JSON offline, pakai renderer strip
yang sama, counter pengulangan pakai haptic Tasbih. Teks Arab FROZEN.

Batch L (Bookmarks/Favorites/Continue, §7.9–7.11): tambah/hapus/lompat, empty
state sungguhan, cap 200/114. Pilih SATU pola hapus (swipe atau long-press),
tulis alasannya di DECISIONS.

Batch N (Settings, §7.12 + setting/index.js): setiap setting persist, langsung
berlaku, punya default waras. Konfigurasi berat (download pack, reciter) di
Settings App HP, bukan di watch.
```

## Batch M — Audio  ·  `clo`, high  ·  **hanya jika S3 = GO**
```
Sesi Batch M. Kalau spikes/s3-audio/RESULT.md = NO-GO: JANGAN bangun apa pun.
Hapus F12 dari PRD, hapus kartu audio di Home, tulis entry DECISIONS, selesai.
Kalau GO: player service (@zos/media), pack download (app-side → TransferFile),
queue, seek, kecepatan, bertahan saat UI ditutup (@zos/app-service), manajer
penyimpanan dengan cap. Dilarang membuat layar audio yang "pura-pura jalan".
```

## Batch O / P  ·  `glm` lo / `clo` xhigh
```
Batch O: transisi, press state, skeleton, empty & error state, ikon, splash. Tidak
ada state tanpa desain. Tidak ada animasi saat sensor streaming.

Batch P (clo, xhigh): audit widget & RAM per halaman terhadap budget DESIGN-SYSTEM
§8; ukur cold start & transisi; tes baterai 24 jam; buang dev-gallery + spikes dari
build; ikon + aset store; versi + CHANGELOG; zeus build. Setiap angka yang meleset:
perbaiki atau minta waiver eksplisit dari Ahmed di DECISIONS.
```

---

## Gate audit (run with `clo`, xhigh, after every batch)

```
Sesi review Gate <X>.
1) AUDIT hasil kerja model lain di batch ini. Titik rawan yang wajib dicek:
   - API Zepp yang dipakai tapi tidak ada di @zeppos/device-types → tandai, hapus.
   - Hex/koordinat hardcoded di luar theme.js/layout.js.
   - Card/row yang tidak lewat safeWidth() → akan kepotong bezel.
   - Widget per item (list, bead, ayah) → harus SCROLL_LIST / strip virtual.
   - Sensor/timer yang tidak berhenti di onDestroy.
   - localStorage diakses di luar src/data/store.js.
   - Teks Arab yang diubah/dinormalisasi oleh model → PELANGGARAN BERAT, revert.
   - GESTURE_RIGHT di-intercept.
   Perbaiki penyimpangan, commit fix terpisah.
2) Jalankan checklist Gate <X> di PLAN, centang satu per satu, tulis buktinya.
3) Kalau lulus DAN Ahmed sudah bilang LULUS: update PROJECT-STATE,
   commit "chore(batch-x): pass gate", merge --no-ff, buat branch batch berikutnya.
Kalau ada satu item saja yang gagal: JANGAN merge.
```

## Bug report (Ahmed → model)

```
BUG <P0/P1/P2>: <gejala persis, error verbatim, foto/log>.
Hipotesis akar: <…>. Arah fix: <…>.
Definisi selesai: <kriteria yang bisa dicentang>. Tambah test/regresi. Commit.
Jangan refactor apa pun di luar fix ini.
```

## Handover (kena limit / ganti model)

```
Commit WIP apa adanya. Isi docs/context/PROJECT-STATE.md:
  Batch: <x> | Progress: <langkah selesai/berjalan> | Next step: <presisi, 1 kalimat>
  Files touched: <daftar> | Blocker: <kalau ada>
Lalu berhenti. Jangan `git checkout .`, jangan rapikan kode orang lain.
```
