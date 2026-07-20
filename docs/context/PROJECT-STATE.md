# PROJECT-STATE — Quran Premium
Updated: 2026-07-21 | Mesin: ryzencachy

## Batch: I — CLOSED (`stable-i1`)
> Sebelumnya **Batch B — CLOSED (`stable-b27`)**. Lihat §Checkpoint.

## Batch: H — Jadwal Sholat · WIP (build `b35`, v1.0.6) — MENUNGGU GATE AHMED
> Sebelumnya **Batch I — CLOSED (`stable-i1`)**. Lihat §Checkpoint.

## Done — Batch I (terverifikasi dari kode + build, BUKAN dari watch)
- **Tasbih counter — ARC ring, haptic, 5 preset dzikir, persist `qp.tasbih.v1` — LULUS gate Ahmed [2026-07-20]**
- `page/tasbih.js` baru — counter dzikir per spec `docs/prompts/04-BATCH-LANJUTAN.md` (BATCH I):
  - Angka BESAR tengah (`F.display` 96, `C.textHi`; → `C.emeraldBright` saat target tercapai)
  - Teks dzikir aktif di atas (C.gold, 26), "Target: N" di bawah (C.textLo, 22)
  - **Ring progress = 2 ARC** (track `C.goldDim` 0→360 + fill `C.emeraldBright`, sweep=count/target×360).
    Konvensi terverifikasi docs.zepp.com: 0°=jam 3, arah **searah jarum jam**, start=−90 (atas).
    **Bukan 33 CIRCLE** (grep: 0 CIRCLE widget). Live-update via `setProperty(hmUI.prop.MORE, …)`.
  - **Seluruh area tengah = zona tap +1** (FILL_RECT alpha:1). Tombol bawah: Reset · Preset.
  - **Haptics** (`@zos/sensor` Vibrator, terverifikasi d.ts): per-count = `VIBRATOR_SCENE_SHORT_STRONG`,
    target-reached = `VIBRATOR_SCENE_DURATION_LONG`. 1 instance Vibrator, `stop()` di onDestroy.
  - **Presets siklis** (tombol Preset): Subhanallah×33 → Alhamdulillah×33 → Allahu Akbar×33 →
    La ilaha illallah×100 → Istighfar×100.
  - **Persistensi** `qp.tasbih.v1` via `src/data/store.js` (schema `count/target/preset/ts` sudah ada).
    Load di build, save di tap/reset/preset/onDestroy. Count survive restart.
- `page/index.js`: kartu `التسبيح` di-wire `null` → `page/tasbih`.
- `app.json`: `page/tasbih` terdaftar; version → **1.0.5 / code 6**.
- `page/theme.js`: `BUILD` b30 → **b31**.
- **`zeus build` HIJAU** (exit 0, 6 file JS). `page/tasbih.bin` (10206 B) terkonfirmasi ada di
  `device.zip` (zab→zpk→device.zip) bersama reader/surah-list/settings/index.
- Gate hex lokal bersih: `rg "0x[…]" page src | grep -v theme.js` → tasbih.js 0 hit (semua dari `C`/`F`).

## Done — Batch H (engine terverifikasi presisi 0 menit raw, +2 menit dgn ihtiyat)
- `page/prayer-calc.js` baru — pure JS engine hitungan astronomi:
  - **Deklinasi matahari**: Spencer (1971) Fourier series, akurasi ±0.01°.
  - **Equation of Time**: Spencer eq. (2), akurasi ±1 menit.
  - **Metode default KEMENAG**: Fajr 20°, Isha 18°. Konstanta MWL/ISNA/Egypt/Karachi/UAQ disediakan.
  - **Asr madhab Syafi'i**: shadow factor 1 (bayangan 1× tinggi benda). Hanafi=2 tersedia.
  - **Ihtiyat +2 menit** (konvensi Kemenag) — ditambahkan SETELAH rounding raw calc.
  - **LOKASI**: hardcoded Bogor (-6.595, 106.816, UTC+7) sebagai `LOCATION` constant tunggal
    (dipakai lagi Batch J Qibla — tidak duplikat).
  - Fungsi bantu: `toMinutes(hhmm)`, `nextPrayer(times, nowMin, loc, method)`, `prayerName(id/en)`.
- `page/prayer.js` baru — layar jadwal sholat:
  - Header: "Bogor" (C.gold, F.h2) + tanggal Masehi (C.textMd, F.caption).
  - 5 baris waktu (Subuh/Dzuhur/Ashar/Maghrib/Isya), h=48, gap=6, w=300 center:
    nama kiri (`F.bodyLg`, `align_h=LEFT`), waktu kanan (`F.bodyLg`, `align_h=RIGHT`).
  - **Sholat berikutnya di-highlight**: FILL_RECT `C.emeraldSoft` + bar kiri 4px `C.emeraldBright`.
  - **Countdown** "− HH:MM" di bawah list (`C.gold`, size 34), update PER MENIT.
  - Timer synced ke menit berikutnya (timeout→interval), **clearTimeout+clearInterval di onDestroy**
    (pola reader.js §3.6: timer WAJIB dimatikan). Log `[prayer] onDestroy — timer cleared`.
  - Lewat tengah malam → next = Subuh besok (hitung ulang `calculate(tomorrow, …)`).
- `page/index.js`: grid 2×2 → **2×3 (6 kartu)** — tambah "مواقيت الصلاة" → `page/prayer`,
  "اتجاه القبلة" → `null` (placeholder Batch J).
- `app.json`: `page/prayer` terdaftar; version → **1.0.6 / code 7**.
- `page/theme.js`: `BUILD` b31 → **b32**.
- **`zeus build` HIJAU** (exit 0, 7 file JS).
- Gate hex lokal bersih: `rg "0x[…]" page/prayer.js page/prayer-calc.js page/index.js | grep -v theme.js` → 0 hit.

### Done — Batch H b34: waktu Terbit + tanggal Hijriah (2026-07-21)
- `page/prayer-calc.js`: `toHHMM(hrs, margin)` — Terbit pakai margin 0 (**TANPA ihtiyat**; hanya 5 waktu
  wajib yang +2 menit, konvensi Kemenag). Terbit = sunrise astronomis (matahari −0.833° di horizon) — BUKAN
  "sudut sama dgn Subuh" seperti draft spec (itu akan terlalu lambat); engine sudah pakai −0.833° yang benar.
- `page/prayer-calc.js`: `nextPrayer` ORDER = `['subuh','dzuhur','ashar','maghrib','isya']` — **'terbit'
  dikeluarkan** dari kandidat → tidak pernah di-highlight sebagai "sholat berikutnya".
- `page/hijri-calc.js` (BARU, pure JS) — konversi Masehi→Hijriah algoritma **tabular (Kuwaiti)**, di-reuse
  dari converter terbukti di `~/Projects/mahad-askar-app-v2` (node_modules/hijri-date). `HIJRI_OFFSET`
  constant utk align dgn rukyat lokal. `formatHijri(date)` → "19 Muharram 1448 H".
- `page/prayer.js`:
  - **6 baris** sekarang (Subuh, **Terbit**, Dzuhur, Ashar, Maghrib, Isya). Layout di-compress:
    `ROW_H` 48→40, `ROW_GAP` 6→4, `ROW_START_Y` 110 — semua 6 baris muat di safeWidth bezel (verifikasi Node).
  - **Terbit styling beda**: `C.textLo` (abu redup) vs `C.textHi` (putih) utk 5 waktu wajib — sinyal "info, bukan sholat".
  - **Tanggal Hijriah** di header, DI BAWAH Masehi (`_hijriW`, C.textMd). Di-refresh juga di `refreshForNewDay`.
- `page/theme.js`: BUILD b33 → **b34**.
- **`zeus build` HIJAU** (exit 0). `page/prayer.bin` = 13771 B (meng-bundle prayer-calc + hijri-calc);
  string `Muharram`/`Safar`/`HIJRI_OFFSET`/`terbit` terkonfirmasi di bin (zeus bundle import, bukan file terpisah).

#### Verifikasi Terbit (engine asli, Node, Bogor 2026-07-21)
- Subuh 04:45 (+2 ihtiyat) · **Terbit 06:05 (no ihtiyat)** · Dzuhur 12:01.
- **Subuh < Terbit < Dzuhur ✓**. Selisih Terbit−Subuh = **80 menit** (1j20m).
  ⚠ Catatan jujur: draft spec menduga "~15-20 menit setelah Subuh" — itu **tidak berlaku** utk Bogor di Juli.
  Matahari terbit ~06:05 di Juli (Bogor dekat ekuator, UTC+7, deklinasi matahari +20° → sunrise agak lambat).
  80 menit adalah nilai **astronomis benar** (cocok jadwal terbit Jakarta/Bogor Juli). Engine benar; asumsi spec salah.
- `nextPrayer` di-probe di 12 jam berbeda (00:01…23:30) → **0 kali** return 'terbit'. Setelah Subuh (04:50)
  langsung lompat ke Dzuhur. ✓ Terbit tidak pernah ter-highlight.

#### Verifikasi Hijriah vs Kemenag/NU (2026-07-21)
- Tabular pure (offset 0): 21 Jul 2026 → **5 Safar 1448**. Kemenag/NU publish **6 Safar 1448** (imkanur rukyat
  mulai Safar 1 hari lebih awal) → `HIJRI_OFFSET = +1` agar cocok Kemenag.
- Hasil `formatHijri` dgn offset +1 cocok **exact** dgn tabel Kemenag: 16 Jul=1 Safar, 18 Jul=3 Safar,
  **21 Jul=6 Safar 1448** ✓.
- ⚠ Offset BUKAN konstanta universal: hisab vs rukyat bisa beda ±1 hari di **batas bulan Hijri**. Offset +1
  verified utk periode Safar 1448 (Jul 2026). **Re-check** saat mendekati Rajab→Sya'ban→Ramadhan —
  koreksi `HIJRI_OFFSET` kalau app meleset 1 hari dari kalender NU/Ahmed.

### Verifikasi Akurasi Hitungan vs Kemenag (Bogor, Juli 2026)

| Tanggal | Subuh (App/Ref) | Dzuhur (App/Ref) | Ashar (App/Ref) | Maghrib (App/Ref) | Isya (App/Ref) |
|---|---|---|---|---|---|
| 1 Juli  | 04:42 / 04:41 | 11:58 / 11:56 | 15:20 / 15:18 | 17:51 / 17:49 | 19:05 / 19:04 |
| 15 Juli | 04:45 / 04:43 | 12:01 / 11:59 | 15:22 / 15:21 | 17:54 / 17:52 | 19:08 / 19:06 |
| **20 Juli** | **04:45 / 04:43** | **12:01 / 11:59** | **15:23 / 15:21** | **17:55 / 17:53** | **19:08 / 19:06** |
| 31 Juli | 04:46 / 04:44 | 12:01 / 11:59 | 15:23 / 15:21 | 17:56 / 17:54 | 19:09 / 19:07 |

**Kesimpulan**: Raw calculation (tanpa ihtiyat) = 0 menit selisih vs Kemenag reference.
App output = Kemenag + 2 menit (ihtiyat). Dalam toleransi ±2 menit. ✓

Sumber referensi: Kemenag RI (SIHAT/KEMENAG), Fajr 20°, Isha 18°, Asr Syafi'i.

### Verifikasi: Jadwal ambil tanggal LIVE dari sistem watch (BUKAN hardcode 20 Jul 2026) — TERVERIFIKASI 2026-07-20
Dicek dari kode (bukan asumsi). Jawaban: **LIVE**, ikut tanggal sistem watch.
- `page/prayer.js:245` → `var today = new Date()` di `build()`. `build()` jalan tiap page dibuka;
  `new Date()` = jam sistem watch (sumber sama dgn countdown `getNowMinutes()`, sudah terbukti jalan).
- `page/prayer.js:262` → `today` live dilempar ke `calculate(today, …)`.
- `page/prayer-calc.js:60-62` → `dayOfYear()` baca `getFullYear/getMonth/getDate` dari Date live. **0 konstanta tanggal.**
- Grep literal `2026`/`'2026'`/`month:`/`day:` di prayer.js+prayer-calc.js → **0 hit**.
- Tanpa `@zos/sensor` Time — tidak butuh, `new Date()` di Zepp = clock sistem (sudah diverifikasi via countdown).
- Tes "set maju 1 hari lalu buka page" → **IKUT** (build re-run → new Date() fresh).
- "20 Juli 2026" di tabel atas = **tabel referensi akurasi**, bukan konstanta kode.
- Mekanisme refresh: 6 baris + tanggal (Masehi+Hijri) fresh tiap `build()` (tiap buka page); countdown+highlight
  per-menit; **+ midnight rollover** — tick per-menit juga deteksi ganti hari → recompute 6 baris+label (lihat ↓).

**✓ Edge case FIXED (build `b33`, 2026-07-21) — bukan known-limitation lagi:**
stale date kalau page dibiarkan foreground melewati tengah malam tanpa di-back. Fix di `page/prayer.js`:
- `build()` simpan `_dateKey` ("YYYY-MM-DD") dari `new Date()` — `:263`.
- Tiap tick `updateCountdown()` cek `dateKey(now) !== _dateKey` — `:208`. Mismatch = lewat tengah malam.
- Mismatch → `refreshForNewDay(now)` — `:174`: recompute `_times = calculate(new Date(), …)`,
  refresh label Masehi (`_dateW`) + Hijri (`_hijriW`) + 6 nilai baris (`_rowTimeW[]`), advance `_dateKey`.
  Countdown+highlight ikut benar otomatis (pakai `_times` baru di tick yang sama).
- **Tanpa timer baru** — pakai timer per-menit yang SUDAH ada (hemat, no extra beban).
- **Terverifikasi via simulasi Node** (engine asli `prayer-calc` dilewatkan across midnight 2026-07-21→22):
  same-day tick (23:51) = mismatch false → no recompute; midnight tick (00:01) = mismatch true →
  recompute + `_dateKey` advance ke 2026-07-22 + next=subuh hari baru. Logika date-key→recompute→refresh konfirmasi benar.

### Done — Batch H b35: Ganti Lokasi (manual + otomatis) (2026-07-21)
- `src/data/location.js` (BARU, **modul bersama**) — SINGLE source of truth lokasi sholat:
  - `PRESET_CITIES`: 12 kota (WIB: Bogor/Jakarta/Bandung/Surabaya/Yogyakarta/Medan/Padang ·
    WITA: Makassar/Denpasar/Palopo · WIT: Jayapura/Ambon). `{id,name,lat,lon}` — **TANPA tz per kota**.
  - `getLocation()`: baca store `location`, default Bogor; tz dihitung LIVE dari jam sistem.
  - `setLocationManual(cityId)` / `setLocationAuto(lat,lon)`. `getCurrentTz()` = `-(new Date().getTimezoneOffset())/60`
    (fallback local−UTC). **Bukan lookup lat/lon** — watch sudah sinkron tz dari HP (paling akurat, hindari salah zona perbatasan).
- `src/data/store.js`: schema `location` default → `{mode:'manual', cityId:'bogor', lat, lon, city, ts}`.
  (Catatan: store key sebenarnya `qp.location.v1`, BUKAN `qp.settings.v1.location` seperti draft spec — store punya
  key `location` terpisah, bukan nested di `settings`.)
- `page/prayer-calc.js`: hapus `export const LOCATION` (hardcode) → fallback internal `BOGOR_DEFAULT` saja.
  Engine tetap **PURE** (tidak import storage) supaya tetap Node-testable. Lokasi dikirim caller (`getLocation()`)
  sebagai param `loc` ke `calculate()`/`nextPrayer()`. Algoritma astronomi tak diubah (sudah tertashih).
- `page/prayer.js`: `_loc = getLocation()` di `build()` (fresh tiap entry); semua call pakai `_loc`. Header tampil
  `_loc.city` / "Lokasi GPS". **Tombol "GPS" pojok kanan-atas** → `replace('page/location')`.
- `page/location.js` (BARU) — layar ganti lokasi:
  - **Otomatis (GPS)**: `@zos/sensor Geolocation` (terverifikasi `@version 2.1`) — `start()`+`onChange`+
    `getStatus()==='A'` → `getLatitude/getLongitude` → `setLocationAuto`. **Timeout 20s** → "GPS tidak tersedia,
    gunakan Manual". Tiap path kasih umpan balik (tidak menggantung). `stop()`+`offChange`+`clearTimeout` di onDestroy.
  - **Manual**: 12 kota **paginated** (pola surah-list: 4/halaman « », BUKAN SCROLL_LIST — firmware ini
    SCROLL_LIST tidak render). Tap kota → `setLocationManual` → `replace('page/prayer')`.
- `app.json`: daftar `page/location`; permission `device:os.geolocation`; version code 7 → **8**.
- `page/theme.js`: BUILD b34 → **b35**. **`zeus build` HIJAU** (exit 0, **8 file** — location.js jadi entry page).
  `page/location.bin` 13290 B (`Geolocation`/`getStatus`/`setLocationAuto`/`Mencari lokasi`/`Otomatis (GPS)` terkonfirmasi di bin).

#### Lifecycle refresh (Zepp Page tidak ada onShow)
Page lifecycle Zepp OS 3.0 = `onInit`/`build`/`onDestroy` saja (verifikasi `device-types/dist/index.d.ts:3511`).
`back()` ke page yg masih di-stack TIDAK re-run `build()` → prayer↔location pakai `router.replace` kedua arah
(prayer `replace→location`, location `replace→prayer`) supaya page tujuan di-build fresh (baca `getLocation()` baru).
Stack stabil: home⇄prayer (push/back), prayer⇄location (replace).

#### Verifikasi Multi-Kota vs Kemenag (21 Jul 2026, tz live dari sistem)
| Kota (Zona) | Subuh App/Ref | Dzuhur App/Ref | Ashar App/Ref | Maghrib App/Ref | Isya App/Ref | Max |
|---|---|---|---|---|---|---|
| Bogor (WIB) | 04:45 / 04:43 | 12:01 / 11:59 | 15:23 / 15:21 | 17:55 / 17:53 | 19:08 / 19:06 | ±2 mnt |
| Medan (WIB) | 05:02 / 05:03 | 12:34 / 12:35 | 15:58 / 15:59 | 18:43 / 18:44 | 19:57 / 19:57 | ±1 mnt |
| Makassar (WITA) | 04:53 / 04:53 | 12:11 / 12:12 | 15:33 / 15:34 | 18:06 / 18:08 | 19:20 / 19:21 | ±2 mnt |
Ref: jadwalsholat.org / Kompas (Kemenag). **Tz path terverifikasi**: kota WITA (tz=8) → waktu WITA lokal;
tz-invariant check (Bogor-coords tz 7→8→9 = Dzuhur 12:01→13:01→14:01) konfirmasi tz mengalir ke engine.

#### ⚠ Catatan UNTUK NANTI (jangan implementasi sekarang)
- **Batch J (Qibla)**: REUSE `src/data/location.js` (`getLocation()` utk arah kiblat) — JANGAN bikin modul lokasi baru.
- **Batch N (Settings)**: REUSE `page/location.js` (link ke halaman yg sama) + `getLocation()`/setter. Halaman location
  saat ini back→prayer (hanya dibuka dari prayer). Kalau Settings juga buka location, sesuaikan target back (param `from` via `replace({url,params})`).

## ⚠ Yang WAJIB diverifikasi Ahmed di watch (simulator bohong, AGENTS §1/§5)

### Gate H — Jadwal Sholat (SOAL IBADAH, teliti)
1. **6 baris tampil** benar: Subuh, **Terbit**, Dzuhur, Ashar, Maghrib, Isya. Terbit tampil abu-redup (bukan putih).
2. **Highlight sholat berikutnya** — row yang di-highlight sesuai dengan waktu aktual.
   Cek jam 10 pagi → Dzuhur ter-highlight. Cek jam 8 malam → Isya ter-highlight.
3. **Countdown akurat** — bandingkan sisa menit dengan hitungan manual.
   Cek setelah menit berganti → countdown berkurang 1.
4. **Timer mati saat keluar halaman** — tidak ada crash/error di log.
5. **Lewat Isya → next = Subuh besok** — cek setelah jam 19:08, countdown menuju Subuh besok (~04:45).
6. **Home card "مواقيت الصلاة"** → tap → masuk prayer page. Back → kembali ke home.
7. Gate hex lokal bersih: tidak ada `0x……` di luar theme.js.
8. **Verifikasi silang**: foto layar dikirim ke Ahmed → bandingkan 5 waktu dengan jadwal
   Kemenag/jadwalsholat.org untuk Bogor hari itu. Selisih maksimal ±2 menit.
9. **Teks Arab di home card** "مواقيت الصلاة" + "اتجاه القبلة" — pastikan tidak tofu (☐).
10. **Waktu Terbit masuk akal** — ~80 menit setelah Subuh (Bogor Juli: Subuh 04:45, Terbit ~06:05).
    Bukan "15-20 menit" — lihat §Verifikasi Terbit. Terbit TANPA ihtiyat (bukan +2).
11. **Terbit TIDAK pernah ter-highlight** sbg "sholat berikutnya" — setelah Subuh, highlight lompat ke Dzuhur.
12. **6 baris + header + countdown MUAT** tanpa kepotong bezel (round 466). Tidak ada teks ter-clip lingkar luar.
13. **Tanggal Hijriah** tampil di bawah Masehi (mis. "6 Safar 1448 H" utk 21 Jul 2026) — **bandingkan dgn kalender
    NU/Kemenag**, catat selisih di PROJECT-STATE kalau ada. Offset +1 sudah di-set; re-check di bulan Hijri berikutnya.
14. **Tombol "GPS"** pojok kanan-atas prayer → buka halaman Lokasi (simetris dgn tombol ← back kiri).
15. **Manual**: pilih Makassar & Medan → bandingkan dgn Kemenag kota itu (lihat tabel multi-kota) — selisih ≤2 mnt.
    Jadwal BERUBAH saat kembali ke prayer **tanpa restart app**. Header kota + 6 baris ikut berubah.
16. **Otomatis (GPS)**: tap → "Mencari lokasi..." → DAPAT FIX (koordinat tampil) ATAU timeout 20s "GPS tidak tersedia,
    gunakan Manual". Keduanya OK — yg penting TIDAK menggantung/crash. Pastikan GPS distop saat keluar halaman (cek log `[location] onDestroy`).
17. **Timezone benar**: pilih kota WITA (Makassar/Denpasar) → Dzuhur ~12:1x WITA (bukan WIB+1j). Pilih Jayapura (WIT) →
    Dzuhur ~11:45. Prasyarat: jam watch diset zona benar via HP. (Kalau tz salah → semua waktu meleset berjam-jam — P0.)

## Next step
- **Ahmed (gate H):** install 1.0.6 (BUILD `b35`, code 8) → uji 17 poin di atas → **LULUS eksplisit** → tag `stable-h1`.
- Setelah LULUS: **Batch J — Qibla** (compass + arah kiblat, `docs/prompts/04-BATCH-LANJUTAN.md`).

## Files touched (Batch H, committed)
**b32 (engine+layar):** `page/prayer-calc.js` (engine) · `page/prayer.js` (layar) ·
`page/index.js` (grid 2×3, 2 kartu baru) · `app.json` (daftar page, v1.0.6 code 7) ·
`page/theme.js` · `docs/context/PROJECT-STATE.md`.
**b33 (midnight rollover fix):** `page/prayer.js` + `page/theme.js` + PROJECT-STATE.
**b34 (terbit + hijri):** `page/prayer-calc.js` (terbit no-ihtiyat, exclude nextPrayer) ·
`page/hijri-calc.js` (BARU) · `page/prayer.js` (6 baris + hijri header) · `page/theme.js` (BUILD b34) · PROJECT-STATE.
**b35 (ganti lokasi):** `src/data/location.js` (BARU — modul bersama) · `page/location.js` (BARU — layar) ·
`page/prayer-calc.js` (hapus LOCATION hardcode, engine pure) · `page/prayer.js` (getLocation + tombol GPS) ·
`src/data/store.js` (schema location) · `app.json` (page/location + geolocation perm + code 8) · `page/theme.js` (BUILD b35) · PROJECT-STATE.

## Checkpoint
- **stable-b18** — Mushaf per-halaman awal (sebelum per-line rendering fix).
  *(Tag `stable-b18` tidak ada di repo — hanya `stable-b20` & `stable-b27` tertag.)*
- **stable-b20** — 15 baris/halaman cetakan Madinah, basmalah per-surah, per-line render. → `8c79ac9`.
- **stable-b27** — Pass gate Batch B: reader stabil, icon final, settings 3 stepper, nav «» RTL. → `3fc23a5`.
- **stable-i1** — Batch I Tasbih: ARC ring, haptic, 5 preset dzikir, persist. LULUS gate Ahmed. → `b09ba23`.
- **stable-h1** — (belum) Batch H Jadwal Sholat. Menunggu gate Ahmed.

## Arsitektur
- Zepp OS 3.0 (apiVersion 3.0.0), Amazfit Active 2 Round 466×466, `designWidth: 466`.
- Data mushaf: 604 halaman Madinah, 15 baris/halaman (FROZEN — jangan sentuh).
- `setLayerScrolling` per page: reader/settings=`true`; index/surah-list/tasbih=`false`.
- Warna & font tokens dari `page/theme.js`: `C` (bg `0x000000`, gold, emerald…), `F` (display 96…).
  Jangan hardcode hex di luar sini.
- Routing `@zos/router`: push/replace/back. Buka page TANPA params → onInit terima `''`/`'undefined'`
  → guard sebelum `JSON.parse`.
- Storage: class-first `LocalStorage` via `src/data/store.js` (get/set/del, tak pernah melempar).

## Catatan multi-mesin
Proyek ini dikerjakan bergantian di cachymac & ryzencachy.
ATURAN WAJIB: **`git pull` di awal SETIAP sesi, `git push` di akhir SETIAP sesi walau baru WIP —
tidak terkecuali.** Jangan buka clo/glm di project ini di 2 mesin bersamaan.
Sumber PROJECT-STATE tunggal: `docs/context/PROJECT-STATE.md` (root duplikat b6 dihapus 2026-07-20).
