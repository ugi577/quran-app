# PROMPT 04 — BATCH LANJUTAN (satu per satu, urut)

> Cara pakai: salin SATU blok prompt → paste ke `clo`/`glm`/`cc-deep` di
> `~/Projects/quran-premium` → kerjakan sampai gate → foto → Ahmed LULUS →
> baru buka blok berikutnya. JANGAN kerjakan dua batch sekaligus.
>
> Urutan: I (Tasbih) → H (Jadwal Sholat) → J (Qibla) → K (Hisnul Muslim) →
> L (Bookmark/Lanjutkan) → N (Settings) → O (Polish) → P (Rilis)
> Tasbih duluan karena paling sederhana (tanpa sensor/lokasi) — kemenangan cepat.

---

## BATCH I — TASBIH  ·  runner: glm/cc-deep

```
Baca AGENTS.md dan docs/context/PROJECT-STATE.md. Kerjakan Batch I (Tasbih).
Shell Fish, dilarang heredoc. Warna hanya dari page/theme.js. Lebar via safeWidth().

FITUR:
1. page/tasbih.js — layar counter dzikir:
   - Angka hitungan BESAR di tengah (F.display 96, C.textHi)
   - Di bawahnya: "Target: 33" (C.textLo, 24)
   - Ring progress: SATU widget ARC melingkar (r≈200, line 10) —
     track C.goldDim redup, fill C.emeraldBright, persen = count/target.
     DILARANG membuat 33 CIRCLE widget.
   - Teks dzikir aktif di atas angka (mis. "سُبْحَانَ الله") warna C.gold, 28.
2. INTERAKSI:
   - SELURUH AREA TENGAH layar = zona tap +1 (bukan cuma tombol kecil)
   - Haptic per hitungan: Vibrator scene pendek-kuat
   - Saat count == target: haptic panjang-kuat + ring penuh + angka jadi C.emeraldBright
   - Tombol kecil bawah (dalam chord aman, dy≤180): [reset] [preset]
3. PRESET dzikir (tap tombol preset untuk ganti, siklis):
   - Subhanallah ×33 → Alhamdulillah ×33 → Allahu Akbar ×33 →
     La ilaha illallah ×100 → Istighfar ×100 → custom target dari settings (nanti)
4. PERSISTENSI: count + preset aktif tersimpan (qp.tasbih.v1 via src/data/store.js
   kalau ada; kalau store.js belum dipakai project, pakai pola storage yang
   SUDAH TERBUKTI di reader (lastRead) — konsisten dengan yang jalan).
   Setelah restart app, hitungan kembali di angka terakhir.
5. HOME: kartu "Tasbih / التسبيح" yang sudah ada di home diarahkan ke page/tasbih.
   Daftarkan page di app.json.

VERIFIKASI GATE I:
- Tap area luas menambah hitungan + getar terasa
- Target tercapai → getar panjang + visual berubah
- Restart app → hitungan tidak hilang
- Ring = 1 ARC (grep memastikan tidak ada loop createWidget CIRCLE 33x)
- Tidak ada hex di luar theme.js; tidak ada elemen kepotong bezel
- zeus preview jalan di jam; foto dikirim ke Ahmed

Commit: feat(batch-i): tasbih counter + haptics + presets
Update PROJECT-STATE (Done/Next/Files). Tag stable-i1 kalau Ahmed LULUS.
```

---

## BATCH H — JADWAL SHOLAT  ·  runner: cc-deep (hitungan astronomi, teliti)

```
Baca AGENTS.md dan docs/context/PROJECT-STATE.md. Kerjakan Batch H (Jadwal Sholat).
Shell Fish, dilarang heredoc. Warna dari page/theme.js. safeWidth() wajib.

BAGIAN 1 — MESIN HITUNG (page/prayer-calc.js, murni JS tanpa dependency):
1. Deklinasi matahari + equation of time (algoritma standar, presisi menit)
2. Metode default KEMENAG: Fajr 20°, Isha 18°. Sediakan konstanta metode lain
   (MWL 18/17, dll) tapi cukup Kemenag yang aktif dulu.
3. Asr madhab SYAFI'I (bayangan 1×)
4. Ihtiyat +2 menit (Dzuhur +2, lainnya +2 sesuai konvensi Kemenag)
5. Input: lat, lon, timezone offset, tanggal. Output: {subuh, terbit, dzuhur,
   ashar, maghrib, isya} dalam menit-sejak-tengah-malam + format HH:MM.
6. LOKASI: hardcode dulu Bogor (-6.595, 106.816, UTC+7) sebagai konstanta di
   satu tempat (nanti settings yang ganti). JANGAN pakai GPS dulu di batch ini.

BAGIAN 2 — LAYAR (page/prayer.js):
1. Header: nama kota "Bogor" (C.gold, label) + tanggal Masehi (C.textMd, caption)
2. 5 baris waktu (Subuh/Dzuhur/Ashar/Maghrib/Isya), h 48, gap 6, w=300 center:
   nama kiri (bodyLg), waktu kanan (bodyLg)
3. SHOLAT BERIKUTNYA di-highlight: fill C.emeraldSoft + bar kiri C.emeraldBright
4. Countdown ke sholat berikutnya di bawah list: "− 02:34" C.gold besar (34)
   Update PER MENIT (timer 60 dtk), BUKAN per detik. Timer berhenti di onDestroy.
5. Lewat tengah malam / semua sholat lewat → next = Subuh besok (hitung tanggal+1).
6. HOME: tambah/arahkan kartu "Jadwal Sholat" ke page ini. Daftarkan di app.json.

VERIFIKASI GATE H (INI SOAL IBADAH — WAJIB TELITI):
- Bandingkan 5 waktu dengan jadwal Kemenag/jadwalsholat resmi untuk BOGOR
  hari ini: selisih maksimal ±2 menit. TULIS TABEL perbandingannya di
  PROJECT-STATE (app vs referensi, per waktu).
- Countdown akurat dan pindah ke sholat berikutnya dengan benar
- Timer mati saat keluar halaman (log di onDestroy)
- Foto layar dikirim ke Ahmed untuk verifikasi silang

JANGAN geser hasil hitung dengan menambah ihtiyat kalau meleset — cari
akar salah hitungnya. Commit: feat(batch-h): prayer times engine + screen
Update PROJECT-STATE. Tag stable-h1 kalau Ahmed LULUS.
```

---

## BATCH J — QIBLA  ·  runner: cc-deep

```
Baca AGENTS.md dan docs/context/PROJECT-STATE.md. Kerjakan Batch J (Qibla).
PERINGATAN: ini soal arah ibadah. Lebih baik TIDAK menampilkan arah daripada
menampilkan arah yang SALAH.

BAGIAN 1 — HITUNG BEARING (tambahkan di prayer-calc.js atau file qibla-calc.js):
- Great-circle bearing dari (lat,lon) user ke Ka'bah (21.4225 N, 39.8262 E)
- Rumus: atan2(sin Δlon, cos φ1·tan φ2 − sin φ1·cos Δlon) → derajat 0-360
- Lokasi: konstanta Bogor yang sama dengan Batch H (SATU sumber, jangan duplikat)
- Bearing Bogor→Ka'bah ≈ 295° (barat-laut). Kalau hasil hitungmu jauh dari
  itu, rumusmu salah — perbaiki sebelum lanjut.

BAGIAN 2 — KOMPAS:
1. VERIFIKASI DULU: import { Compass } from '@zos/sensor' — cek di
   node_modules/@zeppos/device-types apakah ada, method apa saja
   (getDirectionAngle / getDirection / onChange / getStatus).
   Tulis temuan di PROJECT-STATE SEBELUM koding.
2. Kalau Compass ADA dan jalan di device:
   - page/qibla.js: lingkaran kompas (tick ring pakai ARC/garis, atau gambar),
     huruf N/E/S/W (28, C.textMd), jarum/panah emas menunjuk qibla:
     rotasi = qiblaBearing − headingDevice
   - Bearing angka besar di atas: "295°" (C.gold, h1)
   - KALIBRASI: kalau compass.getStatus() menunjukkan belum terkalibrasi,
     SEMBUNYIKAN jarum, tampilkan ikon ∞/8 + teks "Gerakkan jam membentuk angka 8"
   - Sensor start di build, STOP di onDestroy (wajib, boros baterai)
3. Kalau Compass TIDAK ada / tidak jalan di device:
   - Mode degradasi: tampilkan bearing statis "295° dari Utara" + instruksi
     "Arahkan jam ke utara, lalu putar 295° searah jarum jam" + gambar statis
   - JANGAN crash, JANGAN tampilkan jarum palsu yang tidak bergerak

VERIFIKASI GATE J:
- Bandingkan dengan app qibla di HP (2 lokasi kalau bisa): selisih ≤ 5°
- Status kalibrasi jujur (goyang jam → jarum stabil setelah kalibrasi)
- Sensor mati saat keluar (log onDestroy)
- Foto + hasil perbandingan ke Ahmed

Commit: feat(batch-j): qibla compass + calibration UX
Update PROJECT-STATE. Tag stable-j1 kalau LULUS.
```

---

## BATCH K — HISNUL MUSLIM (Dzikir & Doa)  ·  runner: glm

```
Baca AGENTS.md dan docs/context/PROJECT-STATE.md. Kerjakan Batch K (Hisnul Muslim).

DATA:
1. CEK DULU apakah mahad-askar-app-v2 punya data dzikir JSON siap pakai:
   find ~/Projects/mahad-askar-app-v2 -iname "*dzikir*" -o -iname "*doa*" -o -iname "*adhkar*" | head
   Kalau ADA (dari Khulashoh Al-Madad An-Nabawiy / Kanzun Najah yang pernah
   dibuat): SALIN dan pakai — teks sudah ditashih Ahmed sebelumnya.
   Kalau TIDAK ada: buat 4 kategori minimal dari sumber sahih umum
   (dzikir pagi, petang, setelah sholat, sebelum tidur) — masing-masing
   5-10 dzikir inti yang mutawatir (ayat kursi, al-mu'awwidzat, sayyidul
   istighfar, dll). Struktur:
   assets/raw/data/adhkar/{pagi,petang,setelah-sholat,tidur}.json
   [{ "ar": "...", "repeat": 3, "note": "..." }]
   TANDAI di PROJECT-STATE bahwa teks BARU ini WAJIB tashih Ahmed sebelum rilis.

LAYAR:
1. page/adhkar-list.js — 4 kartu kategori (pola kartu home yang sudah ada):
   Pagi / Petang / Setelah Sholat / Sebelum Tidur (label Arab)
2. page/adhkar-read.js — baca per dzikir:
   - Teks Arab (pakai pola render + ukuran font reader yang SUDAH jalan)
   - Counter pengulangan: "1/3" + tap layar = +1 (haptic pendek, pola tasbih)
   - Selesai repeat → otomatis maju ke dzikir berikutnya (haptic panjang)
   - Progress "dzikir 2/7" kecil di atas
3. HOME: kartu keempat (Settings digeser ke settings nanti di Batch N) ATAU
   tambah kartu kelima kalau muat — pakai judgment, yang penting bisa diakses.

VERIFIKASI GATE K:
- 4 kategori terbuka, teks Arab render benar
- Counter + haptic jalan, auto-advance jalan
- Teks yang bersumber dari mahad-askar (sudah ditashih) vs teks baru
  (butuh tashih) TERCATAT jelas di PROJECT-STATE
- Foto ke Ahmed

Commit: feat(batch-k): hisnul muslim adhkar reader
Update PROJECT-STATE. Tag stable-k1 kalau LULUS.
```

---

## BATCH L — BOOKMARK & LANJUTKAN MEMBACA  ·  runner: glm

```
Baca AGENTS.md dan docs/context/PROJECT-STATE.md. Kerjakan Batch L.

KONTEKS: reader per-HALAMAN (604 hlm mushaf Madinah), bookmark toggle sudah
ada stub-nya di reader. lastRead sudah tersimpan. Rapikan dan lengkapi:

1. BOOKMARK:
   - Toggle di reader menyimpan HALAMAN (bukan ayat): qp.bookmarks.v1 =
     [{page, surah, ts}] — surah = surah dominan halaman itu (untuk label)
   - Maksimal 50 bookmark; penuh → tolak + info singkat
   - Indikator visual di reader saat halaman ini ter-bookmark (ikon gold aktif)
2. page/bookmarks.js — daftar bookmark:
   - Pola list yang SUDAH TERBUKTI (pagination 6/halaman ala surah-list,
     BUKAN SCROLL_LIST yang dulu gagal)
   - Baris: "Hlm 49 — البقرة" + tanggal singkat; tap → buka reader halaman itu
   - Hapus: long-press ATAU tombol × kecil di kanan baris (pilih satu yang
     paling reliable di Zepp OS, tulis pilihannya di PROJECT-STATE)
   - Empty state: ikon + "Belum ada bookmark" (bukan layar kosong)
3. LANJUTKAN MEMBACA:
   - Kartu "Continue" di home menampilkan info nyata: "Hlm 49 · البقرة"
     (baca dari lastRead) — bukan teks statis
   - Tap → reader halaman terakhir
4. app.json: daftarkan page/bookmarks.

VERIFIKASI GATE L:
- Bookmark → keluar → buka bookmarks → tap → kembali ke halaman benar
- Hapus bookmark jalan; empty state tampil
- Continue di home selalu menunjukkan posisi terakhir yang benar
- Foto ke Ahmed

Commit: feat(batch-l): bookmarks + continue reading
Update PROJECT-STATE. Tag stable-l1 kalau LULUS.
```

---

## BATCH N — SETTINGS  ·  runner: glm

```
Baca AGENTS.md dan docs/context/PROJECT-STATE.md. Kerjakan Batch N (Settings).

KONSOLIDASI: pengaturan font (ukuran %, spasi baris, spasi kata) SUDAH ada
tersebar. Satukan ke satu halaman settings + tambah yang baru:

1. page/settings.js — daftar setting (pola list terbukti, 6/halaman kalau perlu):
   a. Ukuran Font      → halaman font yang sudah ada (link)
   b. Spasi Baris      → idem
   c. Spasi Kata       → idem
   d. Lokasi Sholat    → pilih preset kota (Bogor default, + Jakarta, Bandung,
      Surabaya, Makassar, Medan — koordinat hardcode). Dipakai Batch H & J.
   e. Bahasa Label     → Arab / Indonesia (label kartu home & judul halaman)
   f. Tentang          → versi app, "Quran Premium", teks singkat sadaqah jariyah
2. SEMUA setting persist (qp.settings.v1) dan langsung berlaku tanpa restart:
   - ganti lokasi → jadwal sholat & qibla ikut berubah saat dibuka lagi
   - ganti bahasa → home re-render label
3. Kartu Settings di home diarahkan ke halaman ini.

VERIFIKASI GATE N:
- Setiap setting tersimpan setelah restart
- Ganti kota → waktu sholat berubah sesuai kota itu (cek 1 kota pembanding)
- Ganti bahasa → label berubah
- Foto ke Ahmed

Commit: feat(batch-n): unified settings
Update PROJECT-STATE. Tag stable-n1 kalau LULUS.
```

---

## BATCH O — POLISH  ·  runner: glm

```
Baca AGENTS.md dan docs/context/PROJECT-STATE.md. Kerjakan Batch O (Polish).
TANPA fitur baru. Hanya merapikan:

1. Press feedback konsisten di SEMUA tombol/kartu (warna press dari theme)
2. Empty state untuk semua daftar yang bisa kosong (bookmarks sudah, cek lain)
3. Error state: data gagal load → pesan singkat + tombol kembali (bukan blank)
4. Konsistensi header semua halaman (posisi, ukuran, warna judul sama)
5. Transisi antar halaman terasa cepat (<200ms perceived)
6. Hapus SEMUA console.log debug yang tidak perlu (sisakan error logging)
7. Hapus page dev/spike yang tidak terpakai dari app.json & folder
8. rg -n "0x[0-9a-fA-F]{6}" page src | grep -v theme.js → HARUS kosong

VERIFIKASI GATE O: jalan-jalan ke semua halaman — tidak ada layar jelek,
tidak ada dead-end, tidak ada blank. Foto tur singkat ke Ahmed.

Commit: chore(batch-o): polish pass
Update PROJECT-STATE. Tag stable-o1 kalau LULUS.
```

---

## BATCH P — PERFORMA & RILIS  ·  runner: clo (paling teliti)

```
Baca AGENTS.md dan docs/context/PROJECT-STATE.md. Kerjakan Batch P (Rilis).

1. AUDIT PERFORMA per halaman:
   - Hitung widget hidup per halaman (target ≤60) — log di build tiap page
   - Cold start → first paint: ukur, target <800ms
   - Timer/sensor: pastikan SEMUA berhenti di onDestroy (grep onDestroy semua page)
2. BATERAI: pakai normal 24 jam (Ahmed yang jalankan), target drain wajar
3. BERSIH-BERSIH BUILD:
   - Buang assets tak terpakai (icon .bak, source svg, dll) dari package
   - Cek ukuran .zab akhir — catat di PROJECT-STATE
4. VERSI & METADATA:
   - app.json: version code+name naikkan (1.0.0), appName "Quran Premium",
     description singkat yang benar
   - CHANGELOG.md: ringkasan fitur v1.0
5. TASHIH FINAL (Ahmed): sampel 10 halaman acak mushaf vs cetakan + semua teks
   adhkar baru (dari Batch K) — WAJIB LULUS sebelum tag rilis
6. zeus build → install BERSIH di jam (hapus dulu versi lama) → tur semua fitur

GATE P (rilis):
- Semua angka audit tercatat di PROJECT-STATE
- Tashih Ahmed LULUS tertulis
- git tag v1.0.0 + push GitHub dengan tags
- Simpan .zab rilis di folder dist/ dan catat checksum-nya

Commit: chore(release): v1.0.0
```

---

## PENGINGAT UNTUK SEMUA BATCH

- Satu batch per sesi. Selesai → foto → tunggu LULUS Ahmed → batch berikutnya.
- Kena limit di tengah: commit WIP + tulis PROJECT-STATE (Done/Next step
  presisi/Files/Blocker) + berhenti. Sesi baru lanjut dari situ.
- Ragu API Zepp → cek node_modules/@zeppos/device-types dulu, jangan menebak.
- Pola yang SUDAH TERBUKTI di proyek ini (storage lastRead, list pagination
  6/halaman, render Arab reader, haptic) = pakai ulang, jangan bikin pola baru.
- Teks Arab apa pun (Quran & adhkar) FROZEN — salah render dilaporkan,
  bukan "diperbaiki".
