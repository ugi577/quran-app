// Home dashboard — Quran Premium
// DESIGN-SYSTEM.md §7.1 + reference visual (commit 88d6b4b)
import { createWidget, widget, align, text_style } from '@zos/ui'
import { push } from '@zos/router'
import { C, F, safeWidth, centerX } from './theme'

Page({
  build() {
    const CX = 233, CY = 233

    // ── Background (full black, AMOLED) ────────────────────────────────
    createWidget(widget.FILL_RECT, { x: 0, y: 0, w: 466, h: 466, color: C.bg })

    // ── Branding section ───────────────────────────────────────────────
    const brandY = 24
    // Ornamen: 3 lingkaran konsentris (gold r30, bg r24, emerald r12)
    createWidget(widget.CIRCLE, { center_x: CX, center_y: brandY + 12, radius: 30, color: C.gold })
    createWidget(widget.CIRCLE, { center_x: CX, center_y: brandY + 12, radius: 24, color: C.bg })
    createWidget(widget.CIRCLE, { center_x: CX, center_y: brandY + 12, radius: 12, color: C.emerald })

    // "QURAN" putih
    createWidget(widget.TEXT, {
      x: 0, y: brandY + 56, w: 466, h: F.h1,
      color: C.textHi,
      text_size: F.h1,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: 'QURAN'
    })

    // "PREMIUM" gold
    createWidget(widget.TEXT, {
      x: 0, y: brandY + 56 + F.h1, w: 466, h: F.label,
      color: C.gold,
      text_size: F.label,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: 'PREMIUM'
    })

    // ── Bismillah kecil ────────────────────────────────────────────────
    const bismillahY = brandY + 56 + F.h1 + F.label + 12
    createWidget(widget.TEXT, {
      x: 0, y: bismillahY, w: 466, h: 40,
      color: C.goldDim,
      text_size: 24,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'
    })

    // ── Divider ────────────────────────────────────────────────────────
    const dividerY = bismillahY + 48
    const dividerW = safeWidth(dividerY, 1)
    createWidget(widget.FILL_RECT, {
      x: centerX(dividerW), y: dividerY, w: dividerW, h: 1,
      color: C.stroke
    })

    // ── 4 menu cards (2×2 grid) ─────────────────────────────────────────
    const CARD_H = 80
    const GAP = 12
    const gridY = dividerY + 24

    const MENU = [
      { label: 'Al-Quran', sub: 'القرآن الكريم', accent: C.emerald, action: () => push({ url: 'page/surah-list' }) },
      { label: 'Continue', sub: 'متابعة القراءة', accent: C.gold, action: () => push({ url: 'page/reader', params: { surahNum: 1 } }) },
      { label: 'Tasbih', sub: 'التسبيح', accent: C.emeraldBright, action: () => console.log('[home] Tasbih tapped') },
      { label: 'Settings', sub: 'الإعدادات', accent: C.textLo, action: () => console.log('[home] Settings tapped') },
    ]

    for (let i = 0; i < MENU.length; i++) {
      const col = i % 2
      const row = Math.floor(i / 2)

      // Base Y for this row
      const cardY = gridY + row * (CARD_H + GAP)

      // Safe width at this Y position
      const rowW = safeWidth(cardY, CARD_H)
      const cardW = Math.floor((rowW - GAP) / 2)

      // X position (centered)
      const cardX = col === 0
        ? centerX(rowW) - cardW - GAP / 2
        : centerX(rowW) + GAP / 2

      const m = MENU[i]

      // Card background (surface)
      createWidget(widget.FILL_RECT, {
        x: cardX, y: cardY, w: cardW, h: CARD_H,
        radius: 20,
        color: C.surface
      })

      // Accent bar (kiri, 4px wide)
      createWidget(widget.FILL_RECT, {
        x: cardX, y: cardY, w: 4, h: CARD_H,
        color: m.accent
      })

      // Label Latin (putih)
      createWidget(widget.TEXT, {
        x: cardX + 12, y: cardY + 16, w: cardW - 24, h: F.body,
        color: C.textHi,
        text_size: F.body,
        align_h: align.LEFT,
        align_v: align.TOP,
        text_style: text_style.NONE,
        text: m.label
      })

      // Subtitle Arab (warna accent)
      createWidget(widget.TEXT, {
        x: cardX + 12, y: cardY + 16 + F.body + 4, w: cardW - 24, h: F.label,
        color: m.accent,
        text_size: F.label,
        align_h: align.LEFT,
        align_v: align.TOP,
        text_style: text_style.NONE,
        text: m.sub
      })

      // Tap target (button, invisible, kirim click)
      createWidget(widget.BUTTON, {
        x: cardX, y: cardY, w: cardW, h: CARD_H,
        radius: 20,
        normal_color: C.surface,
        press_color: C.surfacePress,
        click_func: m.action
      })
    }
  }
})
