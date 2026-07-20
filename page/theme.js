// Build marker — bump every preview round; home renders it so a glance at the
// watch answers "which build is actually installed?" (Zepp App caches installs
// by appId+version, so stale packages are a real failure mode here.)
export const BUILD = 'b34'

export const C = {
  bg: 0x000000, surface: 0x101010, surfacePress: 0x1A1A1A,
  stroke: 0x262626, strokeGold: 0x6B5720,
  gold: 0xD4AF37, goldBright: 0xF2DE9B, goldDim: 0x8A7328,
  emerald: 0x0B6B4A, emeraldBright: 0x17A673, emeraldSoft: 0x0E3A2A,
  textHi: 0xFFFFFF, textMd: 0xB8B8B8, textLo: 0x6E6E6E,
}

export const F = {
  display: 96, h1: 44, h2: 34, bodyLg: 30,
  body: 28, label: 24, caption: 24,
  quran: 32, basmalah: 28,
}

const R_SAFE = 213, CX = 233, CY = 233
export function safeWidth(y, h, max) {
  const dy = Math.max(Math.abs(y - CY), Math.abs(y + h - CY))
  if (dy >= R_SAFE) return 0
  return Math.min(max || 400, Math.floor(2 * Math.sqrt(R_SAFE * R_SAFE - dy * dy)) - 16)
}
export function centerX(w) { return Math.round(CX - w / 2) }
