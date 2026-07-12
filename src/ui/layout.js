// DESIGN-SYSTEM.md §1 — Canvas & the circle
// Round screen: 466×466, center (233, 233), R_safe = 213

const R_SAFE = 213
const CX = 233
const CY = 233

/**
 * Calculate safe width for a given Y position on round screen.
 * Ensures content doesn't get clipped by bezel.
 *
 * @param {number} y - Top Y coordinate
 * @param {number} h - Element height
 * @param {number} max - Maximum width to return (default 400)
 * @returns {number} Safe width in pixels
 */
export function safeWidth(y, h, max = 400) {
  const dy = Math.max(Math.abs(y - CY), Math.abs(y + h - CY))
  if (dy >= R_SAFE) return 0
  return Math.min(max, Math.floor(2 * Math.sqrt(R_SAFE * R_SAFE - dy * dy)) - 16)
}

/**
 * Center an element horizontally on screen.
 * @param {number} w - Element width
 * @returns {number} X coordinate for left edge
 */
export const centerX = (w) => Math.round(CX - w / 2)

/**
 * Safe center X with width pre-calculated via safeWidth.
 * @param {number} y - Top Y coordinate
 * @param {number} h - Element height
 * @param {number} max - Maximum width (default 400)
 * @returns {number} X coordinate for left edge
 */
export function safeCenterX(y, h, max = 400) {
  const w = safeWidth(y, h, max)
  return centerX(w)
}
