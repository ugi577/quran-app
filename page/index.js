// Font comparison spike (D-005) — Quran Premium
// DESIGN-SYSTEM.md §2, §3 — tokens only, no raw hex
import { createWidget, widget, align, text_style } from '@zos/ui'
import { C, F } from './theme'

Page({
  build() {
    const ayah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"

    // Label
    createWidget(widget.TEXT, {
      x: 33, y: 30, w: 400, h: 36,
      color: C.textLo,
      text_size: F.caption,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: "System Font:"
    })

    // Test 1: System font
    createWidget(widget.TEXT, {
      x: 33, y: 70, w: 400, h: 100,
      color: C.gold,
      text_size: F.h2,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.WRAP,
      text: ayah
    })

    // Label
    createWidget(widget.TEXT, {
      x: 33, y: 190, w: 400, h: 36,
      color: C.textLo,
      text_size: F.caption,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: "Amiri Quran:"
    })

    // Test 2: Amiri Quran TTF
    createWidget(widget.TEXT, {
      x: 33, y: 230, w: 400, h: 100,
      color: C.textHi,
      text_size: F.h2,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.WRAP,
      font: 'fonts/Amiri-Quran.ttf',
      text: ayah
    })

    // Label
    createWidget(widget.TEXT, {
      x: 100, y: 370, w: 266, h: 50,
      color: C.emeraldBright,
      text_size: F.caption,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: "D-005: Font comparison"
    })
  }
})
