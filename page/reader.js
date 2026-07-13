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

    // Surah name (center) + prev/next arrows
    const nameW = safeWidth(hdrY + px(6), px(F.h2), 220)
    createWidget(widget.TEXT, {
      x: centerX(nameW), y: hdrY + px(6),
      w: nameW, h: px(F.h2),
      color: C.gold, text_size: F.h2,
      align_h: align.CENTER_H, align_v: align.CENTER_V,
      text_style: text_style.WRAP,
      text: surahName,
    })

    // Prev surah ◀ (left of title)
    if (surahNum > 1) {
      createWidget(widget.BUTTON, {
        x: px(70), y: hdrY + px(6),
        w: px(36), h: px(F.h2),
        normal_color: C.bg,
        press_color: C.stroke,
        text: '◀',
        text_size: F.caption,
        click_func: () => push({ url: 'page/reader', params: { surahNum: surahNum - 1 } })
      })
    }

    // Next surah ▶ (right of title)
    if (surahNum < 114) {
      createWidget(widget.BUTTON, {
        x: px(360), y: hdrY + px(6),
        w: px(36), h: px(F.h2),
        normal_color: C.bg,
        press_color: C.stroke,
        text: '▶',
        text_size: F.caption,
        click_func: () => push({ url: 'page/reader', params: { surahNum: surahNum + 1 } })
      })
    }

    // Divider
    const divY = hdrY + hdrRowH + px(4)
    const divW = safeWidth(divY, px(2))
    createWidget(widget.FILL_RECT, {
      x: centerX(divW), y: divY, w: divW, h: px(2), color: C.stroke,
    })

    // ======================= BODY — SCROLL_LIST (expanded) =======================
    const bodyY = divY + px(6)
    const bodyH = px(340)  // expanded — no bottom bar
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

    // ======================= SIDE BUTTONS — Home (kiri) + Back (kanan) =======================
    // Diposisikan di tengah vertikal (y=233) agar tidak terpotong round bezel
    const SIDE_W = px(48)
    const SIDE_H = px(80)
    const SIDE_Y = 193   // 233 - 80/2 = centered vertically
    const SIDE_LEFT = px(24)
    const SIDE_RIGHT = px(394)  // 466 - 24 - 48

    // ⌂ Home (sisi kiri)
    createWidget(widget.BUTTON, {
      x: SIDE_LEFT, y: SIDE_Y, w: SIDE_W, h: SIDE_H,
      radius: px(24),
      color: C.surfacePress,
      normal_color: C.surfacePress,
      press_color: C.stroke,
      text: '⌂',
      text_size: F.h2,
      click_func: () => push({ url: 'page/index' })
    })

    // ↩ Back (sisi kanan)
    createWidget(widget.BUTTON, {
      x: SIDE_RIGHT, y: SIDE_Y, w: SIDE_W, h: SIDE_H,
      radius: px(24),
      color: C.surfacePress,
      normal_color: C.surfacePress,
      press_color: C.stroke,
      text: '↩',
      text_size: F.h2,
      click_func: () => back()
    })

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
