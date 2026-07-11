// Tema Premium AMOLED — Quran App
//
// Token desain terpusat. Semua warna dalam format 0xRRGGBB.
// Latar pure-black untuk efisiensi baterai AMOLED (pixel mati = hitam).
//
// CATATAN: file ini hanya berisi konstanta. Jangan hardcode warna di page;
// impor dari sini agar seluruh UI konsisten dan mudah diubah.

import { px } from "@zos/utils";
import { settings } from "./store.js";

// ── Warna ──────────────────────────────────────────────────────────────
export const BG        = 0x000000; // latar utama (AMOLED off-pixel)
export const SURFACE   = 0x0E1411; // kartu / permukaan (emerald sangat gelap)
export const SURFACE_2 = 0x141C18; // permukaan sekunder
export const GOLD      = 0xFFD700; // aksen utama
export const EMERALD   = 0x50C878; // aksen sekunder
export const TEXT      = 0xFFFFFF; // teks utama
export const MUTED     = 0x889988; // teks sekunder
export const DIVIDER   = 0x2A2A2A; // garis pemisah
export const PRESS     = 0xFFFFFF; // warna highlight saat ditekan
export const ERROR     = 0xFF4444; // teks error / gagal muat

// Aksen per fitur (menggantikan hex hardcode di menu)
export const ACCENT = {
  quran:  EMERALD,
  tasbih: 0x29B6F6,
  prayer: 0xCE93D8,
  qibla:  GOLD,
};

// ── Token ukuran (di-scale oleh px()) ──────────────────────────────────
export const RADIUS      = () => px(16); // sudut kartu (pembulatan menyusul)
export const TAP_MIN     = () => px(72); // target sentuh minimal (a11y)
export const PAD_ROUND   = () => px(50); // padding layar bulat
export const PAD_SQUARE  = () => px(30); // padding layar kotak
export const PAD_DEFAULT = () => px(50);

// Tema aktif (bisa diganti saat fitur light/dark mode ditambahkan)
export const active = {
  bg: BG,
  surface: SURFACE,
  gold: GOLD,
  emerald: EMERALD,
  text: TEXT,
  muted: MUTED,
  divider: DIVIDER,
  press: PRESS,
  error: ERROR,
};

// ── Variasi tema (siap untuk light/dark) ─────────────────────────────
const VARIANTS = {
  dark: {
    bg: BG, surface: SURFACE, gold: GOLD, emerald: EMERALD,
    text: TEXT, muted: MUTED, divider: DIVIDER, press: PRESS,
  },
  // "hijau": tukar peran emas/emerald (aksen utama jadi hijau)
  hijau: {
    bg: BG, surface: SURFACE, gold: EMERALD, emerald: GOLD,
    text: TEXT, muted: MUTED, divider: DIVIDER, press: PRESS,
  },
};

// Terapkan varian + simpan pilihan ke storage
export function setVariant(name) {
  const v = VARIANTS[name] || VARIANTS.dark;
  Object.assign(active, v);
  const s = settings.get();
  s.theme = name in VARIANTS ? name : "dark";
  settings.set(s);
  return active;
}

// ── Skala huruf pembaca Al-Quran ────────────────────────────────────
export function fontStep() {
  const s = settings.get();
  const f = typeof s.font === "number" ? s.font : 1;
  return f >= 0 && f <= 2 ? f : 1;
}

export function fontScale() {
  return [0.85, 1, 1.18][fontStep()];
}

// Muat pilihan tema tersimpan saat modul dimuat
(function initTheme() {
  try {
    const s = settings.get();
    if (s && s.theme) setVariant(s.theme);
  } catch (e) { /* biarkan default dark */ }
})();

export default { BG, SURFACE, SURFACE_2, GOLD, EMERALD, TEXT, MUTED, DIVIDER, PRESS, ERROR, ACCENT, RADIUS, TAP_MIN, PAD_ROUND, PAD_SQUARE, PAD_DEFAULT, active, VARIANTS, setVariant };
