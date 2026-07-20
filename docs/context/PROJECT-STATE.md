# PROJECT-STATE — Quran Premium
Updated: 2026-07-20 | Mesin: ryzencachy

## Batch: I — Tasbih · WIP (build `b31`, v1.0.5) — MENUNGGU GATE AHMED
> Sebelumnya **Batch B — CLOSED (`stable-b27`)**. Lihat §Checkpoint.

## Done — Batch I (terverifikasi dari kode + build, BUKAN dari watch)
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

## ⚠ Yang WAJIB diverifikasi Ahmed di watch (simulator bohong, AGENTS §1/§5)
1. **Ring ARC animasi** — `setProperty(prop.MORE, {start_angle,end_angle})` utk ARC: terbukti utk
   properti lain di docs, tapi update sudut ARC live belum diuji di watch. Kalau ring tidak bergerak
   → ganti ke widget `ARC_PROGRESS` ronde berikutnya.
2. **Tashih 5 string Arab preset** — teks BARU (bukan dari source FROZEN). Harus cocok cetakan/dzikir
   baku sebelum gate ditutup. Salah render → laporkan, jangan "diperbaiki" sendiri.
3. **Haptic scenes** terasa sesuai (short-strong per hit, long di target).
4. Gate I penuh (lihat `docs/prompts/04-BATCH-LANJUTAN.md`): tap luas + getar, target→getar panjang+visual,
   restart→count tidak hilang, ring=ARC, tidak ada elemen kepotong bezel.

## Next step
- **Ahmed (gate I):** install 1.0.5 (BUILD `b31`) → kartu Tasbih → uji 4 poin di atas + tashih Arab
  → pernyataan **LULUS eksplisit** → tag `stable-i1`. (Gate HANYA ditutup Ahmed, bukan agent.)
- Setelah LULUS: **Batch H — Jadwal Sholat** (`docs/prompts/04-BATCH-LANJUTAN.md`, runner cc-deep; mesin hitung
  astronomi, teliti). Tasbih duluan karena paling sederhana (tanpa sensor/lokasi) — sudah selesai.

## Files touched (Batch I, belum commit)
`page/tasbih.js` (baru) · `page/index.js` (wire kartu) · `app.json` (daftar page, v1.0.5 code 6) ·
`page/theme.js` (BUILD b31) · `docs/context/PROJECT-STATE.md` (file ini) ·
`docs/prompts/04-BATCH-LANJUTAN.md` (spec Batch I–P)

## Checkpoint
- **stable-b18** — Mushaf per-halaman awal (sebelum per-line rendering fix).
  *(Tag `stable-b18` tidak ada di repo — hanya `stable-b20` & `stable-b27` tertag.)*
- **stable-b20** — 15 baris/halaman cetakan Madinah, basmalah per-surah, per-line render. → `8c79ac9`.
- **stable-b27** — Pass gate Batch B: reader stabil, icon final, settings 3 stepper, nav «» RTL. → `3fc23a5`.
- **stable-i1** — (belum) Batch I Tasbih. Menunggu gate Ahmed.

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
