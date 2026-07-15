# Project State — Quran Premium (Zepp OS 3.0 smartwatch app)

## Checkpoint stabil

- **stable-b20**: Mushaf 15 baris per halaman sesuai cetakan Madinah, basmalah per-surah,
  per-line rendering dari lines[].words[], round nav buttons.
  `git tag -a stable-b20`

- **stable-b18**: Mushaf per-halaman awal (sebelum per-line rendering fix).
  `git tag -a stable-b18`

## Kalau ada masalah, kembali ke

```
git checkout stable-b20
```

## Arsitektur

- Zepp OS 3.0, Amazfit Active 2, layar bundar 466×466
- Data mushaf: 604 halaman Madinah, 15 baris/halaman, kata per kata
- setLayerScrolling(true) — satu layer scroll global, tidak support sub-region fixed
- Warna dari page/theme.js (C = colors, F = font sizes)

## Batch history

| Build | Perubahan utama |
|---|---|
| b20-b22 | Per-line rendering, round nav, basmalah fix, font 3-100% |
| b18-b19 | Mushaf 604 halaman, scroll fix |
| b14-b17 | Continuous mushaf, 3-zone, flowing text experiments |
| b13 | Circular ayah numbers + app icon |
| b8-b12 | Data minification, utf8Decode join fix, SCROLL_LIST removal |
| b6-b7 | Initial reader, storage probe |
