// Quran Reader page — Quran Premium
// DESIGN-SYSTEM.md §7.2
// SCROLL_LIST body with virtualized ayat, working navigation
import { createWidget, widget, align, text_style } from '@zos/ui'
import { C, F, safeWidth, centerX } from './theme'
import { px } from '@zos/utils'
import { push, back } from '@zos/router'
import { getSurah, getSurahIndex } from '../src/data/quran'

Page({
  build() {
    // --- Load data ---
    const surahNum = this.surahNum || 1
    const surah = getSurah(surahNum)
    if (!surah) { this._showError('Surah not available'); return }

    const surahIndex = getSurahIndex()
    const meta = surahIndex.find(s => s.nomor === surahNum)
    const surahName = meta ? meta.namaLatin : `Surah ${surahNum}`
    const totalAyat = surah.jumlahAyat
    const ayat = surah.ayat || []

    console.log(`[Reader] Build surah ${surahNum}: "${surahName}" — ${totalAyat} ayat`)

    // --- Background ---
    createWidget(widget.FILL_RECT, { x: 0, y: 0, w: 466, h: 466, color: C.bg })

    // ======================= HEADER =======================
    const hdrY = px(12)
    const hdrRowH = px(48)

    // Back button ←
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
        console.log('[Reader] Back')
        back()
      },
    })

    // Surah name (center)
    const nameW = safeWidth(hdrY + px(6), px(F.h2), 320)
    createWidget(widget.TEXT, {
      x: centerX(nameW), y: hdrY + px(6),
      w: nameW, h: px(F.h2),
      color: C.gold, text_size: F.h2,
      align_h: align.CENTER_H, align_v: align.CENTER_V,
      text_style: text_style.WRAP,
      text: surahName,
    })

    // --- Divider ---
    const divY = hdrY + hdrRowH + px(4)
    const divW = safeWidth(divY, px(2))
    createWidget(widget.FILL_RECT, {
      x: centerX(divW), y: divY, w: divW, h: px(2), color: C.stroke,
    })

    // ======================= BODY — SCROLL_LIST =======================
    const bodyY = divY + px(6)
    const bodyH = px(290)
    const bodyW = safeWidth(bodyY, bodyH, 396)
    const itemH = px(84) // generous height for wrapped Arabic text
    const bodyWInner = bodyW - px(20) // text inset from card edge

    // Build data array: one object per ayah
    const listData = ayat.map(a => ({
      num: a.nomor,
      arab: a.arab,
      label: `${a.nomor}`,
    }))

    const dataCount = listData.length

    createWidget(widget.SCROLL_LIST, {
      x: centerX(bodyW),
      y: bodyY,
      w: bodyW,
      h: bodyH,
      item_size: itemH,
      item_gap: px(6),
      data_count: dataCount,
      data_array: listData,
      data_size: dataCount * (itemH + px(6)),
      item_config: [
        // Ayah number (gold, left side)
        {
          type: 'TEXT',
          text: (item) => item.label,
          x: px(6),
          y: px(8),
          w: px(32),
          h: px(28),
          color: C.gold,
          text_size: F.label,
          align_h: align.CENTER_H,
          align_v: align.CENTER_V,
        },
        // Arabic text (white, wraps across remaining width)
        {
          type: 'TEXT',
          text: (item) => item.arab,
          x: px(42),
          y: px(4),
          w: bodyWInner - px(42),
          h: itemH - px(8),
          color: C.textHi,
          text_size: F.body,
          align_h: align.LEFT,
          align_v: align.CENTER_V,
          text_style: text_style.WRAP,
        },
      ],
      item_click_func: (item) => {
        console.log(`[Reader] Tapped ayah ${item.num}`)
      },
    })

    console.log(`[Reader] SCROLL_LIST: ${dataCount} items`)

    // ======================= BOTTOM BAR =======================
    const barY = bodyY + bodyH + px(8)
    const barH = px(56)
    const barW = safeWidth(barY, barH)
    const barX = centerX(barW)

    // Bar background
    createWidget(widget.FILL_RECT, {
      x: barX, y: barY, w: barW, h: barH,
      radius: px(28), color: C.surface,
    })

    const btnW = px(80)
    const btnH = px(44)
    const btnY = barY + px(6)

    // Prev surah button
    if (surahNum > 1) {
      createWidget(widget.BUTTON, {
        x: barX + px(12), y: btnY, w: btnW, h: btnH,
        radius: px(22),
        color: C.surfacePress,
        normal_color: C.surfacePress,
        press_color: C.stroke,
        text: '◀ Surah',
        text_size: F.caption,
        click_func: () => {
          console.log(`[Reader] Prev surah → ${surahNum - 1}`)
          push({ url: 'page/reader', params: { surahNum: surahNum - 1 } })
        },
      })
    }

    // Bookmark toggle (center)
    const bmW = px(52)
    createWidget(widget.BUTTON, {
      x: barX + Math.round((barW - bmW) / 2),
      y: btnY, w: bmW, h: btnH,
      radius: px(22),
      color: C.goldDim,
      normal_color: C.goldDim,
      press_color: C.gold,
      text: '۞',
      text_size: F.h1,
      click_func: () => {
        console.log(`[Reader] Bookmark: ${surahNum}:ayat`)
      },
    })

    // Next surah button
    if (surahNum < 114) {
      createWidget(widget.BUTTON, {
        x: barX + barW - btnW - px(12),
        y: btnY, w: btnW, h: btnH,
        radius: px(22),
        color: C.surfacePress,
        normal_color: C.surfacePress,
        press_color: C.stroke,
        text: 'Surah ▶',
        text_size: F.caption,
        click_func: () => {
          console.log(`[Reader] Next surah → ${surahNum + 1}`)
          push({ url: 'page/reader', params: { surahNum: surahNum + 1 } })
        },
      })
    }

    console.log('[Reader] build complete')
  },

  onDestroy() {
    console.log(`[Reader] onDestroy — save lastRead`)
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
