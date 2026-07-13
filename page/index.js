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
    const dividerY = bismillahY + 40 + 8  // after bismillah text + small gap
    const dividerW = safeWidth(dividerY, 1)
    createWidget(widget.FILL_RECT, {
      x: centerX(dividerW), y: dividerY, w: dividerW, h: 1,
      color: C.stroke
    })

    // ── 4 menu cards (2×2 grid) ─────────────────────────────────────────
    // §4: Arabic-only labels, F.bodyLg, centered, no background box
    // §3: Invisible tap target — BUTTON normal_color=C.bg (transparent on AMOLED)
    // §2: Grid centered via gridW=cardW×2+GAP, gridLeft=centerX(gridW)
    // §1: click_func calls push() directly — BUTTON first, TEXT on top passes touch through
    const CARD_H = 56   // single line of 30px text — was 80 for dual-line
    const GAP = 12
    const gridY = dividerY + 8   // tight — moved up so row 2 doesn't clip bezel

    const MENU = [
      { label: 'القرآن الكريم', accent: C.emerald,       action: () => push({ url: 'page/surah-list' }) },
      { label: 'متابعة القراءة', accent: C.gold,          action: () => push({ url: 'page/reader', params: { surahNum: 1 } }) },
      { label: 'التسبيح',        accent: C.emeraldBright, action: () => console.log('[home] Tasbih tapped') },
      { label: 'الإعدادات',      accent: C.textLo,        action: () => console.log('[home] Settings tapped') },
    ]

    for (let i = 0; i < MENU.length; i++) {
      const col = i % 2
      const row = Math.floor(i / 2)
      const cardY = gridY + row * (CARD_H + GAP)
      const m = MENU[i]

      // Safe chord width at this Y, then derive card width
      const rowW = safeWidth(cardY, CARD_H)
      const cardW = Math.floor((rowW - GAP) / 2)

      // Center the 2-card row on screen
      const gridW = cardW * 2 + GAP
      const gridLeft = centerX(gridW)
      const cardX = col === 0 ? gridLeft : gridLeft + cardW + GAP

      // §3 — Invisible tap target (BUTTON = first widget, bottom layer)
      // normal_color = C.bg (0x000000) → invisible on AMOLED black background
      // press_color = C.stroke → subtle brief highlight on tap
      createWidget(widget.BUTTON, {
        x: cardX, y: cardY, w: cardW, h: CARD_H,
        radius: 12,
        color: C.bg,
        normal_color: C.bg,
        press_color: C.stroke,
        click_func: m.action
      })

      // Accent bar — left edge, on top of invisible button
      createWidget(widget.FILL_RECT, {
        x: cardX + 1, y: cardY + 8, w: 4, h: CARD_H - 16,
        radius: 2,
        color: m.accent
      })

      // §4 — Arabic label only, centered, single line
      createWidget(widget.TEXT, {
        x: cardX + 12, y: cardY, w: cardW - 24, h: CARD_H,
        color: C.textHi,
        text_size: F.bodyLg,
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text_style: text_style.NONE,
        text: m.label
      })
    }
  }
})
