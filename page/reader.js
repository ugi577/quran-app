// Quran Reader page — Quran Premium
// DESIGN-SYSTEM.md §7.2
import { createWidget, widget, align, text_style } from '@zos/ui'
import { C, F, safeWidth, centerX } from './theme'
import { px } from '@zos/utils'
import { push, back } from '@zos/router'
import { getSurah, getSurahIndex } from '../src/data/quran'

Page({
  onInit(params) {
    // push() params tiba sebagai string (JSON object di-stringify oleh router)
    try {
      const p = typeof params === 'string' ? JSON.parse(params) : params
      this._surahNum = (p && p.surahNum) ? p.surahNum : null
    } catch (e) {
      this._surahNum = null
    }
  },

  build() {
    // surahNum === null → mode "lanjut baca" (last read atau surah 1)
    const surahNum = this._surahNum || 1
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
      click_func: () => back()
    })

    // Surah name (center)
    const nameW = safeWidth(hdrY + px(6), px(F.h2), 280)
    createWidget(widget.TEXT, {
      x: centerX(nameW), y: hdrY + px(6),
      w: nameW, h: px(F.h2),
      color: C.gold, text_size: F.h2,
      align_h: align.CENTER_H, align_v: align.CENTER_V,
      text_style: text_style.WRAP,
      text: surahName,
    })

    // Surah number badge (top right)
    createWidget(widget.TEXT, {
      x: px(360), y: hdrY + px(10),
      w: px(80), h: px(28),
      color: C.textLo, text_size: F.caption,
      align_h: align.RIGHT, align_v: align.CENTER_V,
      text: `${surahNum}/114`,
    })

    // Divider
    const divY = hdrY + hdrRowH + px(4)
    const divW = safeWidth(divY, px(2))
    createWidget(widget.FILL_RECT, {
      x: centerX(divW), y: divY, w: divW, h: px(2), color: C.stroke,
    })

    // ======================= BODY — SCROLL_LIST =======================
    const bodyY = divY + px(6)
    const bodyH = px(290)
    const bodyW = safeWidth(bodyY, bodyH, 396)
    const itemH = px(84)

    const listData = ayat.map(a => ({
      num: a.nomor,
      arab: a.arab,
      label: `${a.nomor}`,
    }))

    createWidget(widget.SCROLL_LIST, {
      x: centerX(bodyW),
      y: bodyY,
      w: bodyW,
      h: bodyH,
      item_size: itemH,
      item_gap: px(6),
      data_count: listData.length,
      data_array: listData,
      data_size: listData.length * (itemH + px(6)),
      item_config: [
        // Ayah number
        {
          type: 'TEXT',
          text: (item) => item.label,
          x: px(6), y: px(8), w: px(32), h: px(28),
          color: C.gold, text_size: F.label,
          align_h: align.CENTER_H, align_v: align.CENTER_V,
        },
        // Arabic text
        {
          type: 'TEXT',
          text: (item) => item.arab,
          x: px(42), y: px(4), w: bodyW - px(52), h: itemH - px(8),
          color: C.textHi, text_size: F.body,
          align_h: align.LEFT, align_v: align.CENTER_V,
          text_style: text_style.WRAP,
        },
      ],
      item_click_func: (item) => {
        console.log(`[Reader] Tapped ayah ${item.num}`)
      },
    })

    // ======================= BOTTOM BAR =======================
    const barY = bodyY + bodyH + px(8)
    const barH = px(56)
    const barW = safeWidth(barY, barH)
    const barX = centerX(barW)

    createWidget(widget.FILL_RECT, {
      x: barX, y: barY, w: barW, h: barH,
      radius: px(28), color: C.surface,
    })

    const btnW = px(80)
    const btnH = px(44)
    const btnY = barY + px(6)

    // Prev surah
    if (surahNum > 1) {
      createWidget(widget.BUTTON, {
        x: barX + px(12), y: btnY, w: btnW, h: btnH,
        radius: px(22),
        color: C.surfacePress,
        normal_color: C.surfacePress,
        press_color: C.stroke,
        text: '◀',
        text_size: F.caption,
        click_func: () => push({ url: 'page/reader', params: { surahNum: surahNum - 1 } })
      })
    }

    // Index button (center)
    createWidget(widget.BUTTON, {
      x: barX + Math.round((barW - px(52)) / 2),
      y: btnY, w: px(52), h: btnH,
      radius: px(22),
      color: C.goldDim,
      normal_color: C.goldDim,
      press_color: C.gold,
      text: 'فهرس',
      text_size: F.caption,
      click_func: () => back()
    })

    // Next surah
    if (surahNum < 114) {
      createWidget(widget.BUTTON, {
        x: barX + barW - btnW - px(12),
        y: btnY, w: btnW, h: btnH,
        radius: px(22),
        color: C.surfacePress,
        normal_color: C.surfacePress,
        press_color: C.stroke,
        text: '▶',
        text_size: F.caption,
        click_func: () => push({ url: 'page/reader', params: { surahNum: surahNum + 1 } })
      })
    }

    console.log(`[Reader] build complete — ${listData.length} ayat`)
  },

  onDestroy() {
    console.log('[Reader] onDestroy')
  },

  _showError(msg) {
    createWidget(widget.FILL_RECT, { x: 0, y: 0, w: 466, h: 466, color: C.bg })
    createWidget(widget.TEXT, {
      x: px(50), y: px(160), w: px(366), h: px(60),
      color: C.gold, text_size: F.body,
      align_h: align.CENTER_H, align_v: align.CENTER_V,
      text: msg,
    })
  },
})
