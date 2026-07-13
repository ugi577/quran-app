// Quran Reader — pattern from working quran-app
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { push, back } from '@zos/router'
import { C } from './theme'
import { getSurah, getSurahIndex } from '../src/data/quran'

const CX = 233, R_SAFE = 213
function safeWidth(y, h, max) {
  const dy = Math.max(Math.abs(y - CX), Math.abs(y + h - CX))
  if (dy >= R_SAFE) return 0
  return Math.min(max || 400, Math.floor(2 * Math.sqrt(R_SAFE * R_SAFE - dy * dy)) - 16)
}
function centerX(w) { return Math.round(CX - w / 2) }

function label(text, x, y, w, h, color, size) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x, y, w, h, color,
    text_size: size,
    text,
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.WRAP,
  })
}

function fill(x, y, w, h, color) {
  return hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color })
}

function tapZone(x, y, w, h, cb) {
  var zone = hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color: 0x000000, alpha: 1 })
  zone.addEventListener(hmUI.event.CLICK_DOWN, cb)
  return zone
}

Page({
  onInit(params) {
    try {
      const p = typeof params === 'string' ? JSON.parse(params) : params
      this._sn = (p && p.surahNum) ? p.surahNum : null
    } catch (e) { this._sn = null }
  },

  build() {
    hmUI.setLayerScrolling(true)
    const surahNum = this._sn || 1
    const surah = getSurah(surahNum)
    if (!surah) {
      fill(0, 0, 466, 466, C.bg)
      label('Surah not available', px(50), px(200), px(366), px(60), C.gold, 28)
      return
    }

    const surahIndex = getSurahIndex()
    const meta = surahIndex.find(s => s.nomor === surahNum)
    const surahName = meta ? meta.namaLatin : 'Surah ' + surahNum
    const ayat = surah.ayat || []

    // Background
    fill(0, 0, 466, 466, C.bg)

    // Header
    const hdrY = px(12)
    const hdrH = px(48)

    // Back button
    var backBtn = fill(px(16), hdrY, px(44), hdrH, C.surface)
    backBtn.addEventListener(hmUI.event.CLICK_DOWN, function () { back() })
    label('←', px(16), hdrY, px(44), hdrH, C.textHi, px(34))

    // Surah name
    const nameW = safeWidth(hdrY + px(6), hdrH, 300)
    label(surahName, centerX(nameW), hdrY + px(6), nameW, hdrH, C.gold, px(34))

    // Divider
    const divY = hdrY + hdrH + px(4)
    const divW = safeWidth(divY, px(2))
    fill(centerX(divW), divY, divW, px(2), C.stroke)

    // SCROLL_LIST
    const bodyY = divY + px(6)
    const bodyH = px(340)
    const bodyW = safeWidth(bodyY, bodyH, 396)
    const itemH = px(84)

    const listData = ayat.map(function (a) {
      return { num: a.nomor, arab: a.arab, label: '' + a.nomor }
    })

    hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
      x: centerX(bodyW), y: bodyY, w: bodyW, h: bodyH,
      item_size: itemH, item_gap: px(6),
      data_count: listData.length,
      data_array: listData,
      data_size: listData.length * (itemH + px(6)),
      item_config: [
        {
          type: 'TEXT', text: function (item) { return item.label },
          x: px(6), y: px(8), w: px(32), h: px(28),
          color: C.gold, text_size: 24,
          align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
        },
        {
          type: 'TEXT', text: function (item) { return item.arab },
          x: px(42), y: px(4), w: bodyW - px(52), h: itemH - px(8),
          color: C.textHi, text_size: 28,
          align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
          text_style: hmUI.text_style.WRAP,
        },
      ],
      item_click_func: function (item) {
        console.log('[Reader] Tapped ayah ' + item.num)
      },
    })

    // Side buttons — Home kiri + Back kanan
    const SW = px(48), SH = px(80), SY = 193

    tapZone(px(24), SY, SW, SH, function () { push({ url: 'page/index' }) })
    label('⌂', px(24), SY, SW, SH, C.textHi, px(34))

    tapZone(px(394), SY, SW, SH, function () { back() })
    label('↩', px(394), SY, SW, SH, C.textHi, px(34))
  },
})
