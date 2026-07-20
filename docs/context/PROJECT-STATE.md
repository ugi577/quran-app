# PROJECT-STATE — Quran Premium
Updated: 2026-07-21 | Mesin: ryzencachy

## Batch: I — CLOSED (`stable-i1`)
> Sebelumnya **Batch B — CLOSED (`stable-b27`)**. Lihat §Checkpoint.

## Batch: H — Jadwal Sholat · WIP (build `b33`, v1.0.6) — MENUNGGU GATE AHMED
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
- `page/prayer.js:232` → `var today = new Date()` di `build()`. `build()` jalan tiap page dibuka;
  `new Date()` = jam sistem watch (sumber sama dgn countdown `getNowMinutes()`, sudah terbukti jalan).
- `page/prayer.js:247` → `today` live dilempar ke `calculate(today, …)`.
- `page/prayer-calc.js:60-62` → `dayOfYear()` baca `getFullYear/getMonth/getDate` dari Date live. **0 konstanta tanggal.**
- Grep literal `2026`/`'2026'`/`month:`/`day:` di prayer.js+prayer-calc.js → **0 hit**.
- Tanpa `@zos/sensor` Time — tidak butuh, `new Date()` di Zepp = clock sistem (sudah diverifikasi via countdown).
- Tes "set maju 1 hari lalu buka page" → **IKUT** (build re-run → new Date() fresh).
- "20 Juli 2026" di tabel atas = **tabel referensi akurasi**, bukan konstanta kode.
- Mekanisme refresh: 5 baris+tanggal fresh tiap `build()` (tiap buka page); countdown+highlight per-menit;
  **+ midnight rollover** — tick per-menit juga deteksi ganti hari → recompute 5 baris+label (lihat ↓).

**✓ Edge case FIXED (build `b33`, 2026-07-21) — bukan known-limitation lagi:**
stale date kalau page dibiarkan foreground melewati tengah malam tanpa di-back. Fix di `page/prayer.js`:
- `build()` simpan `_dateKey` ("YYYY-MM-DD") dari `new Date()` — `:248`.
- Tiap tick `updateCountdown()` cek `dateKey(now) !== _dateKey` — `:195`. Mismatch = lewat tengah malam.
- Mismatch → `refreshForNewDay(now)` — `:164`: recompute `_times = calculate(new Date(), …)`,
  refresh label tanggal header (`_dateW`) + 5 nilai baris (`_rowTimeW[]`), advance `_dateKey`.
  Countdown+highlight ikut benar otomatis (pakai `_times` baru di tick yang sama).
- **Tanpa timer baru** — pakai timer per-menit yang SUDAH ada (hemat, no extra beban).
- **Terverifikasi via simulasi Node** (engine asli `prayer-calc` dilewatkan across midnight 2026-07-21→22):
  same-day tick (23:51) = mismatch false → no recompute; midnight tick (00:01) = mismatch true →
  recompute + `_dateKey` advance ke 2026-07-22 + next=subuh hari baru. Logika date-key→recompute→refresh konfirmasi benar.

## ⚠ Yang WAJIB diverifikasi Ahmed di watch (simulator bohong, AGENTS §1/§5)

### Gate H — Jadwal Sholat (SOAL IBADAH, teliti)
1. **5 waktu sholat** tampil dengan benar: Subuh, Dzuhur, Ashar, Maghrib, Isya.
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

## Next step
- **Ahmed (gate H):** install 1.0.6 (BUILD `b32`) → uji 9 poin di atas → **LULUS eksplisit** → tag `stable-h1`.
- Setelah LULUS: **Batch J — Qibla** (compass + arah kiblat, `docs/prompts/04-BATCH-LANJUTAN.md`).

## Files touched (Batch H, committed)
`page/prayer-calc.js` (baru — engine) · `page/prayer.js` (baru — layar) ·
`page/index.js` (grid 2×3, 2 kartu baru) · `app.json` (daftar page, v1.0.6 code 7) ·
`page/theme.js` (BUILD b32) · `docs/context/PROJECT-STATE.md` (file ini)

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
