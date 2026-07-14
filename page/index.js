// Home dashboard — Quran Premium
// Pattern from working quran-app: FILL_RECT + addEventListener(CLICK_DOWN)
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { push } from '@zos/router'
import { C, BUILD } from './theme'

// Inline helpers (mirip quran-app utils/ui.js)
function label(text, x, y, w, h, color, size) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x, y, w, h, color,
    text_size: size,
    text,
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
  })
}

function fill(x, y, w, h, color) {
  return hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color })
}

function tapZone(x, y, w, h, cb) {
  var zone = hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x, y, w, h,
    color: C.bg,
    alpha: 1,
  })
  zone.addEventListener(hmUI.event.CLICK_DOWN, cb)
  return zone
}

// Safe width helper (tetap diperlukan utk round screen)
const CX = 233, CY = 233, R_SAFE = 213
function safeWidth(y, h, max) {
  const dy = Math.max(Math.abs(y - CY), Math.abs(y + h - CY))
  if (dy >= R_SAFE) return 0
  return Math.min(max || 400, Math.floor(2 * Math.sqrt(R_SAFE * R_SAFE - dy * dy)) - 16)
}
function centerX(w) { return Math.round(CX - w / 2) }

Page({
  build() {
    hmUI.setLayerScrolling(false)

    // ── Background ──
    fill(0, 0, 466, 466, C.bg)

    // ── Branding ──
    const brandY = 24
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX, center_y: brandY + 12, radius: 30, color: C.gold })
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX, center_y: brandY + 12, radius: 24, color: C.bg })
    hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: CX, center_y: brandY + 12, radius: 12, color: C.emerald })

    label('QURAN',   0, brandY + 56,            466, 36, C.textHi, 36)
    label('PREMIUM', 0, brandY + 56 + 36,       466, 20, C.gold, 20)
    label('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', 0, brandY + 56 + 36 + 20 + 8, 466, 40, C.goldDim, 24)

    // ── Divider ──
    const divY = brandY + 56 + 36 + 20 + 8 + 40 + 8
    const divW = safeWidth(divY, 1)
    fill(centerX(divW), divY, divW, 1, C.stroke)

    // ── 4 menu cards (2×2 grid) ──
    const CARD_H = 56
    const GAP = 12
    const gridY = divY + 12

    const CARDS = [
      { label: 'القرآن الكريم', url: 'page/surah-list' },
      { label: 'متابعة القراءة', url: 'page/reader' },
      { label: 'التسبيح',        url: null },
      { label: 'الإعدادات',      url: 'page/settings' },
    ]

    for (let i = 0; i < CARDS.length; i++) {
      const col = i % 2
      const row = Math.floor(i / 2)
      const cardY = gridY + row * (CARD_H + GAP)
      const c = CARDS[i]

      const rowW = safeWidth(cardY, CARD_H)
      const cardW = Math.floor((rowW - GAP) / 2)
      const gridW = cardW * 2 + GAP
      const gridLeft = centerX(gridW)
      const cardX = col === 0 ? gridLeft : gridLeft + cardW + GAP

      // Teks card — warna accent
      const accent = [C.emerald, C.gold, C.emeraldBright, C.textLo][i]
      label(c.label, cardX, cardY, cardW, CARD_H, accent, 28)

      // Tap zone — FILL_RECT invisible + addEventListener (PATTERN QURAN-APP)
      const targetUrl = c.url
      tapZone(cardX, cardY, cardW, CARD_H, function () {
        if (targetUrl) {
          push({ url: targetUrl })
        } else {
          console.log('[home] ' + c.label + ' tapped')
        }
      })
    }

    // Build marker — MUST match the round in theme.js BUILD. If the watch
    // doesn't show this string, it is running a stale cached install.
    label(BUILD, 0, 408, 466, 24, C.textLo, 20)
  }
})
