# PROJECT-STATE — Quran Premium
Updated: 2026-07-20 | Mesin: ryzencachy

## Batch: B — CLOSED (stable-b27)

## Done
Fitur yang SUDAH jalan & terverifikasi langsung dari kode di HEAD (`3fc23a5`):

- **Mushaf reader** (`page/reader.js`) — render per-halaman 604 halaman cetakan Madinah,
  15 baris/halaman, kata per kata dari `lines[].words[]`. Tiap baris = satu TEXT widget,
  `text_style.WRAP` (wrap bila melebihi lebar), tinggi via `textH()`.
- **App icon final** (`assets/default.b|r|s/icon.png`, 248930 B) — latar **hijau
  zamrud (emerald)** + buku terbuka emas + bulan sabit & bintang emas + teks
  "QURAN / PREMIUM". (Terverifikasi visual — bukan latar hitam.)
- **Settings 3 stepper** (`page/settings.js`) — Font / Spasi (line) / Kata (word),
  masing-masing tombol −/+. `setLayerScrolling(true)` (scroll global).
- **Font size mapping FINAL** (`page/settings.js:38-39`):
  `PCT_STEPS = [7,8,9,10,20,30,40,50,60,70,80,90,100]`
  `SIZE_MAP  = [12,13,15,16,18,21,24,27,30,33,36,39,42]`
  → 7%=12pt … 100%=42pt. Default `mushafSize=21` (=30%). Step 7/8/9% menggantikan
  set sebelumnya yang mulai dari 10%.
- **Line & word spacing manual** — field storage `settings.lineSpacing` (default 100,
  steps `[30..130]`) & `settings.wordSpacing` (default 100, steps `[30..120]`),
  diatur di `page/settings.js` (row "Spasi" / "Kata"), diterapkan di `page/reader.js`:
  wordSpacing → spacer `''`(≤50%) / `' '`(default) / `'  '`(≥120%);
  lineSpacing → `gap = max(1, round(2·lineSpPct/100))`.
- **Nav footer «» RTL** (`page/reader.js:246-254`) — `ftrCH=['»','⌂','«']`.
  **Kiri = `»` → next page (maju), kanan = `«` → prev page (mundur), tengah = `⌂ → home.**
- **Storage** (`src/data/store.js`) — backend utama = `new LocalStorage()` (class,
  @version 3.0); fallback = instance `localStorage`; keduanya mati → no-op default,
  **tidak pernah melempar**. Pola dari `c73be5a` **masih dipakai**, tidak diganti.
  Akses HANYA via `store.js` (get/set/del). b27 hanya menambah field SCHEMA
  `lineSpacing`/`wordSpacing`.
- **Build marker** `page/theme.js`: `BUILD='b30'` (penanda on-watch, terpisah dari tag git).

## Next step: Batch I — Tasbih (docs/prompts/04-BATCH-LANJUTAN.md)
> ⚠ `docs/prompts/04-BATCH-LANJUTAN.md` & `docs/PLAN.md` **belum ada di repo** — buat
> dulu sebelum mulai. Schema `tasbih` (count/target/preset/ts) sudah ter-stub di
> `src/data/store.js:100`, jadi Batch I = Tasbih sudah dipersiapkan di data layer.

## Files touched (delta b20 → b27, commit `3fc23a5`)
- `assets/default.b/icon.png` · `assets/default.r/icon.png` · `assets/default.s/icon.png` — icon final
- `page/reader.js` — word/line spacing, nav «» RTL, leading-empty compaction, `text_style.WRAP`
- `page/settings.js` — 3 stepper rows, PCT_STEPS 7-100%, `pctFromSize()`
- `page/theme.js` — `BUILD` b21 → b30
- `src/data/store.js` — tambah `lineSpacing`/`wordSpacing` di SCHEMA default
- `docs/context/PROJECT-STATE.md` — file ini

## Checkpoint
- **stable-b18** — Mushaf per-halaman awal (sebelum per-line rendering fix).
  *(Catatan: tag `stable-b18` TIDAK ditemukan di repo — hanya `stable-b20` & `stable-b27`
  yang tertag. Deskripsi diambil dari riwayat doc lama.)*
- **stable-b20** — Mushaf 15 baris/halaman sesuai cetakan Madinah, basmalah per-surah,
  per-line rendering dari `lines[].words[]`, round nav buttons. `git tag stable-b20` → `8c79ac9`.
- **stable-b27** — Pass gate: reader stabil, icon final (emerald+emas), settings 3 stepper
  dengan font 7-100% + line/word spacing, nav «» RTL, storage LocalStorage class.
  `git tag stable-b27` → `3fc23a5` (= HEAD). `git checkout stable-b27` untuk rollback.

## Arsitektur
- Zepp OS 3.0, Amazfit Active 2 Round, layar bundar 466×466, `designWidth: 466`.
- Data mushaf: 604 halaman Madinah, 15 baris/halaman, kata per kata (FROZEN — jangan sentuh).
- `setLayerScrolling` per page: `reader.js`=`true`, `settings.js`=`true`,
  `index.js`=`false`, `surah-list.js`=`false`. Satu layer scroll global, tidak support
  sub-region fixed → reader bangun TEXT per-baris, bukan widget per-item.
- Warna & font size tokens dari `page/theme.js`: `C` = colors (bg `0x000000`, gold, emerald…),
  `F` = font sizes (display 96 … basmalah 28). Jangan hardcode hex/koordinat di luar sini.
- Routing: `@zos/router` push/replace/back/home/exit. Firmware ini buka page TANPA params
  → `onInit` terima string `''`/`'undefined'` → selalu guard sebelum `JSON.parse`.
- Storage: class-first `LocalStorage` via `src/data/store.js` (lihat atas).

## Catatan multi-mesin
Proyek ini dikerjakan bergantian di cachymac & ryzencachy.
ATURAN WAJIB: **`git pull` di awal SETIAP sesi, `git push` di akhir SETIAP sesi walau
baru WIP — tidak terkecuali.** Jangan buka clo/glm di project ini di 2 mesin bersamaan.
