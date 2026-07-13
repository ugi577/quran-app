// Surah List page — Quran Premium
// DESIGN-SYSTEM.md §7.3 — SCROLL_LIST with 114 surahs
import { createWidget, widget, align, text_style } from '@zos/ui'
import { C, F, safeWidth, centerX } from './theme'
import { px } from '@zos/utils'
import { push, back } from '@zos/router'
import { getSurahIndex } from '../src/data/quran'

Page({
  build() {
    console.log('[SurahList] build start')

    const surahIndex = getSurahIndex()
    if (!surahIndex || surahIndex.length === 0) {
      this._showError('No surah data available')
      return
    }
    console.log(`[SurahList] Loaded ${surahIndex.length} surahs`)

    // --- Background ---
    createWidget(widget.FILL_RECT, { x: 0, y: 0, w: 466, h: 466, color: C.bg })

    // ======================= HEADER =======================
    const hdrY = px(12)
    const hdrRowH = px(48)

    // Back button
    createWidget(widget.BUTTON, {
      x: px(16), y: hdrY,
      w: px(44), h: hdrRowH,
      radius: px(22),
      color: C.surface,
      normal_color: C.surface,
      press_color: C.stroke,
      text: '←',
      text_size: F.h2,
      click_func: () => {
        console.log('[SurahList] Back')
        back()
      },
    })

    // Title
    const titleW = safeWidth(hdrY + px(6), px(F.h2), 380)
    createWidget(widget.TEXT, {
      x: centerX(titleW), y: hdrY + px(6),
      w: titleW, h: px(F.h2),
      color: C.gold, text_size: F.h2,
      align_h: align.CENTER_H, align_v: align.CENTER_V,
      text: '114 Surah',
    })

    // Divider
    const divY = hdrY + hdrRowH + px(4)
    const divW = safeWidth(divY, px(2))
    createWidget(widget.FILL_RECT, {
      x: centerX(divW), y: divY, w: divW, h: px(2), color: C.stroke,
    })

    // ======================= SCROLL_LIST =======================
    const listY = divY + px(6)
    const listH = px(310)  // dikurangi utk bottom nav bar
    const listW = safeWidth(listY, listH, 396)
    const itemH = px(56)

    // Prepare data array
    const listData = surahIndex.map(s => ({
      num: s.nomor,
      nameAr: s.nama,
      nameLatin: s.namaLatin,
      ayatCount: s.jumlahAyat,
      tempatTurun: s.tempatTurun,
    }))

    createWidget(widget.SCROLL_LIST, {
      x: centerX(listW),
      y: listY,
      w: listW,
      h: listH,
      item_size: itemH,
      item_gap: px(6),
      data_count: listData.length,
      data_array: listData,
      data_size: listData.length * (itemH + px(6)),
      item_config: [
        // Surah number (gold)
        {
          type: 'TEXT',
          text: (item) => item.num.toString(),
          x: px(12),
          y: px(4),
          w: px(40),
          h: itemH - px(8),
          color: C.gold,
          text_size: F.bodyLg,
          align_h: align.CENTER_H,
          align_v: align.CENTER_V,
        },
        // Latin name
        {
          type: 'TEXT',
          text: (item) => item.nameLatin,
          x: px(56),
          y: px(4),
          w: listW - px(120),
          h: px(26),
          color: C.textHi,
          text_size: F.label,
          align_h: align.LEFT,
          align_v: align.CENTER_V,
          text_style: text_style.WRAP,
        },
        // Arabic name
        {
          type: 'TEXT',
          text: (item) => item.nameAr,
          x: px(56),
          y: px(28),
          w: listW - px(120),
          h: px(22),
          color: C.textMd,
          text_size: F.caption,
          align_h: align.LEFT,
          align_v: align.CENTER_V,
          text_style: text_style.WRAP,
        },
        // Ayat count
        {
          type: 'TEXT',
          text: (item) => `${item.ayatCount}`,
          x: listW - px(56),
          y: px(4),
          w: px(48),
          h: itemH - px(8),
          color: C.textLo,
          text_size: F.caption,
          align_h: align.CENTER_H,
          align_v: align.CENTER_V,
        },
      ],
      item_click_func: (item) => {
        console.log(`[SurahList] Tap surah ${item.num}: ${item.nameLatin}`)
        push({ url: 'page/reader', params: { surahNum: item.num } })
      },
    })

    // ======================= BOTTOM BAR — Home | Back =======================
    const barY = listY + listH + px(8)
    const barH = px(56)
    const barW = safeWidth(barY, barH)
    const barX = centerX(barW)

    createWidget(widget.FILL_RECT, {
      x: barX, y: barY, w: barW, h: barH,
      radius: px(28), color: C.surface,
    })

    const btnW = Math.floor((barW - px(24)) / 2)
    const btnH = px(44)
    const btnY = barY + px(6)

    // ⌂ Home (kiri)
    createWidget(widget.BUTTON, {
      x: barX + px(8), y: btnY, w: btnW, h: btnH,
      radius: px(22),
      color: C.surfacePress,
      normal_color: C.surfacePress,
      press_color: C.stroke,
      text: '⌂',
      text_size: F.h2,
      click_func: () => push({ url: 'page/index' })
    })

    // ↩ Back (kanan)
    createWidget(widget.BUTTON, {
      x: barX + px(8) + btnW + px(8), y: btnY, w: btnW, h: btnH,
      radius: px(22),
      color: C.surfacePress,
      normal_color: C.surfacePress,
      press_color: C.stroke,
      text: '↩',
      text_size: F.h2,
      click_func: () => back()
    })

    console.log('[SurahList] build complete')
  },

  _showError(msg) {
    createWidget(widget.FILL_RECT, { x: 0, y: 0, w: 466, h: 466, color: C.bg })
    createWidget(widget.TEXT, {
      x: px(50), y: px(200), w: px(366), h: px(60),
      color: C.textLo, text_size: F.body,
      align_h: align.CENTER_H, align_v: align.CENTER_V,
      text: msg,
    })
  },
})
