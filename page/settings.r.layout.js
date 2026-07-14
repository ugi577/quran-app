import { px } from "@zos/utils";

export default {
  safeWidth: (y, h, max = 400) => {
    const R_SAFE = 213, CX = 233, CY = 233
    const dy = Math.max(Math.abs(y - CY), Math.abs(y + h - CY))
    if (dy >= R_SAFE) return 0
    return Math.min(max, Math.floor(2 * Math.sqrt(R_SAFE * R_SAFE - dy * dy)) - 16)
  },
  centerX: (w) => Math.round(233 - w / 2),
}
