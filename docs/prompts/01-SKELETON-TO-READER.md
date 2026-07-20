# PROMPT 01 — BATCH A+B+C: Skeleton → Theme → Nav → Reader Prototype

> Runner: `glm` atau `cc-deep` (lo–high). Paste di folder `/home/cachymac/Projects/quran-premium`.
> Bisa juga dipakai di `clo` kalau quota tersedia.

---

Baca `AGENTS.md` dan `docs/context/PROJECT-STATE.md` dan `docs/PLAN.md`.

## KONTEKS

Spike S2 sudah LULUS — **RENDER-B dikunci**: teks Quran disimpan sebagai JSON dan dirender
pakai TEXT widget (`@zos/ui`). System font Zepp OS sudah terbukti bisa render Uthmani dengan
shaping yang benar (huruf sambung, RTL, harakat, shaddah). Lihat foto di `docs/audit/`.

Proyek referensi: `/home/cachymac/Projects/mahad-askar-app-v2`
- Quran data JSON ada di sana (surah index, ayah teks Uthmani) — salin dan adaptasi.
- Jangan pakai Dexie/IndexedDB — Zepp OS pakai `@zos/storage` `localStorage`.
- Quran reader visualnya ada di sana — pelajari alurnya, adaptasi ke widget Zepp OS.

## ATURAN KETAT

1. **Shell = Fish.** JANGAN pakai `<< EOF` heredoc. Tulis file via editor atau file tool.
2. **Jangan pakai API Zepp yang belum diverifikasi.** Cek dulu:
   `rg -n "<symbol>" node_modules/@zeppos/device-types --glob '*.d.ts'`
3. **Hex warna HANYA di `src/ui/theme.js`.** Tidak ada `0xD4AF37` hardcoded di tempat lain.
4. **Semua lebar card/row lewat `safeWidth(y, h)`.** Layar BUNDAR, bukan kotak.
5. **Teks Quran FROZEN.** Jangan pernah edit karakter Arab. Pernah. Sekali pun.
6. **Commit kecil per sub-langkah.** Update PROJECT-STATE di akhir sesi.
7. Kalau limit/blocker: commit WIP, tulis PROJECT-STATE, berhenti.

## LANGKAH-LANGKAH

### A1. Struktur folder
Buat folder contract (jangan hapus file yang sudah ada):
```
src/ui/          theme.js  layout.js  components.js  icons.js  nav.js
src/data/        store.js  quran.js  prayer.js  tasbih.js
src/services/    (kosong dulu)
page/            home.js  reader.js  surah-list.js  (dll nanti)
assets/466x466-gtr-4/  (atau target yang sudah ada, cek app.json)
```

### A2. Update app.json
```json
{
  "app": {
    "appName": "Quran Premium",
    "description": "Premium Quran companion for the wrist"
  },
  "targets": {
    "default": {
      "module": {
        "page": {
          "pages": [
            "page/home",
            "page/reader",
            "page/surah-list"
          ]
        },
        "app-side": { "path": "app-side/index" },
        "setting": { "path": "setting/index" }
      },
      "platforms": [{ "st": "r", "dw": 466 }]
    }
  }
}
```
*(merge dengan app.json yang sudah ada, jangan overwrite seluruhnya)*

### A3. Theme (`src/ui/theme.js`)
Token dari `docs/DESIGN-SYSTEM.md` §2 dan §3. Contoh:
```js
export const C = {
  bg:           0x000000,
  surface:      0x101010,
  surfacePress: 0x1A1A1A,
  stroke:       0x262626,
  gold:         0xD4AF37,
  goldBright:   0xF2DE9B,
  goldDim:      0x8A7328,
  emerald:      0x0B6B4A,
  emeraldBright:0x17A673,
  emeraldSoft:  0x0E3A2A,
  textHi:       0xFFFFFF,
  textMd:       0xB8B8B8,
  textLo:       0x6E6E6E,
}
export const F = { display: 96, h1: 44, h2: 34, bodyLg: 30, body: 28, label: 24, caption: 24 }
```

### A4. Layout (`src/ui/layout.js`)
Fungsi `safeWidth` dan `centerX` **persis** dari DESIGN-SYSTEM §1.

### A5. Components (`src/ui/components.js`)
Minimal untuk Batch B: Header, Card, ListRow. Semuanya pakai `safeWidth()` — tidak ada lebar hardcoded.

### A6. Navigation (`src/ui/nav.js`)
Wrapper `@zos/router`. BasePage helper yang menghentikan semua timer/sensor di `onDestroy`.
**JANGAN intercept GESTURE_RIGHT.**

### A7. Data store (`src/data/store.js`)
Satu pintu ke `localStorage`. Namespaced `qp.*`, versioned, ada fungsi migrasi.

### A8. Quran data (`src/data/quran.js`)
**SUMBER PASTI — salin dari mahad-askar-app-v2:**

```fish
set SRC ~/Projects/mahad-askar-app-v2/android/app/src/main/assets/public/data/quran
set DST ~/Projects/quran-premium/assets/data/quran

mkdir -p $DST
cp $SRC/index.json $DST/              # surah metadata index
cp -r $SRC/[0-9]*.json $DST/          # 114 surah files (1.json … 114.json)
# Optional: cp $SRC/mushaf/index.json $DST/mushaf-index.json
```

**Format per-surah file** (contoh `2.json` = Al-Baqarah):
```json
[
  {"nomor": 131, "arab": "وَوَصّٰى بِهَآ اِبْرٰهٖمُ...", "terjemah": "Dan Ibrahim mewasiatkan..."},
  {"nomor": 132, "arab": "...", "terjemah": "..."}
]
```
Setiap object: `nomor` = nomor ayat, `arab` = teks Arab (Kemenag), `terjemah` = terjemah Indonesia.

**Juga salin index.json** — cek isinya dulu:
```fish
cat $SRC/index.json | head -30
```
Itu berisi metadata 114 surah (nama Latin, nama Arab, jumlah ayat, dll).

**Penting — `src/data/quran.js`** harus:
1. Load `index.json` saat app start (kecil, metadata saja)
2. Load per-surah `{n}.json` **on demand** saat reader dibuka (lazy load)
3. Cache di memory (max 3 surah aktif, evict yang lama)
4. Expose: `getSurahList()`, `getSurah(n)`, `getAyah(surah, ayah)`
5. **JANGAN modify teks Arab. FROZEN.**

### A9. Home page (`page/home.js`)
Sesuai DESIGN-SYSTEM §7.1:
- Crescent glyph + Hijri date + jam di atas
- 4 kartu scrollable: Continue Reading, Next Prayer, Tasbih, Continue Audio
- Hanya 1 timer (1 Hz), berhenti di `onDestroy`
- Kartu = tap target → push ke halaman terkait

### A10. Quran Reader (`page/reader.js`) — INTI
Sesuai DESIGN-SYSTEM §7.2:
- Header: nama surah (gold, h2) + nomor ayat
- Body: scrollable TEXT widget(s) dengan teks Uthmani
- **Setiap ayat = 1 TEXT widget** (bukan 1 per baris). Font size coba 28–32, tuning nanti.
- Nomor ayat di akhir setiap ayat sebagai inline text: `﴿١﴾` (Unicode ornament)
- Gold untuk ayah number, white untuk teks utama
- Bottom bar: ← (prev surah) · bookmark toggle · → (next surah)
- `onDestroy` → simpan lastRead ke store
- **Referensi visual: lihat Quran reader di mahad-askar-app-v2** — alur dan gesture serupa,
  tapi widget berbeda (Zepp OS TEXT widget, bukan HTML/CSS).

### A11. Surah list (`page/surah-list.js`)
Sesuai DESIGN-SYSTEM §7.3:
- SCROLL_LIST dengan `data_array` (BUKAN 114 widget manual)
- Setiap row: nomor (gold) + nama Latin + nama Arab (teks, bukan gambar — S2 sudah lulus)
- Tap → push ke reader dengan surah terpilih

### A12. Build & test
```fish
zeus preview
```
Install ke jam, foto setiap layar. Tulis hasilnya di PROJECT-STATE.

---

## GATE CHECKLIST (untuk sesi audit berikutnya)

- [ ] `zeus build` sukses tanpa error
- [ ] Install dan render di jam asli
- [ ] Tidak ada hex warna di luar `theme.js` (`rg -n "0x[0-9a-fA-F]{6}" src page | grep -v theme.js`)
- [ ] Semua card/row pakai `safeWidth()` — tidak ada elemen kepotong bezel
- [ ] Teks Arab muncul dan terbaca di jam (bukan tofu)
- [ ] Home → Reader navigasi jalan, back jalan
- [ ] Home → Surah List → tap surah → Reader jalan
- [ ] Reader menyimpan lastRead saat keluar
- [ ] Reader bisa scroll ayat
- [ ] Bookmark toggle menyimpan ke store
- [ ] Tidak ada timer/sensor yang leak (log line di onDestroy)
- [ ] ≤ 60 widget per page
- [ ] Cold start < 800 ms (ukur)
- [ ] PROJECT-STATE terupdate

## DILARANG

- Menambah fitur di luar daftar di atas
- Mengubah teks Quran
- Menggunakan heredoc bash
- Hardcode warna/koordinat
- Install dependency baru
- Refactor tanpa diminta
