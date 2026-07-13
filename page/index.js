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

    // "QURAN" putih — slightly smaller (36px vs F.h1=44)
    const Q_H = 36
    createWidget(widget.TEXT, {
      x: 0, y: brandY + 56, w: 466, h: Q_H,
      color: C.textHi,
      text_size: Q_H,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: 'QURAN'
    })

    // "PREMIUM" gold — slightly smaller (20px vs F.label=24)
    const P_H = 20
    createWidget(widget.TEXT, {
      x: 0, y: brandY + 56 + Q_H, w: 466, h: P_H,
      color: C.gold,
      text_size: P_H,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: 'PREMIUM'
    })

    // ── Bismillah kecil ────────────────────────────────────────────────
    const bismillahY = brandY + 56 + Q_H + P_H + 8
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
    // §4: Arabic-only labels, F.bodyLg, no background box
    // §3: No visible card bg — BUTTON normal_color=C.bg invisible on AMOLED
    // §2: Grid centered via gridW=cardW×2+GAP, gridLeft=centerX(gridW)
    // §1: BUTTON dengan text property (bawaan) — bukan TEXT widget terpisah.
    //     TEXT widget di Zepp OS memblokir touch event ke BUTTON di bawahnya.
    const CARD_H = 56
    const GAP = 12
    const gridY = dividerY + 8

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

      const rowW = safeWidth(cardY, CARD_H)
      const cardW = Math.floor((rowW - GAP) / 2)
      const gridW = cardW * 2 + GAP
      const gridLeft = centerX(gridW)
      const cardX = col === 0 ? gridLeft : gridLeft + cardW + GAP

      // §1+§3 — BUTTON sebagai tap target + label teks (text property bawaan).
      // BUTTON harus paling atas (last widget) agar tidak tertutup widget lain
      // yang memblokir touch. normal_color=C.bg → invisible di AMOLED.
      createWidget(widget.BUTTON, {
        x: cardX, y: cardY, w: cardW, h: CARD_H,
        radius: 12,
        normal_color: C.bg,
        press_color: C.stroke,
        text: m.label,
        text_size: F.bodyLg,
        click_func: m.action
      })
    }
  }
})
