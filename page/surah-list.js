// Surah List — pattern from working quran-app
// b4: halaman ini merangkap PROBE STORAGE. Import store (@zos/storage) sengaja
// ditaruh DI SINI, terpisah dari reader: kalau import ini fatal di runtime,
// halaman ini ikut mati total (header/side button hilang) = vonis jelas; kalau
// hidup, label probe menulis hasil get/set. Reader b4 bebas storage.
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { push, back } from '@zos/router'
import { C, BUILD } from './theme'
import { getSurahIndex } from '../src/data/quran'
import { get as storeGet, set as storeSet } from '../src/data/store'

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
  })
}

function fill(x, y, w, h, color) {
  return hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color })
}

function tapZone(x, y, w, h, cb) {
  var zone = hmUI.createWidget(hmUI.widget.FILL_RECT, { x, y, w, h, color: C.bg, alpha: 1 })
  zone.addEventListener(hmUI.event.CLICK_DOWN, cb)
  return zone
}

Page({
  build() {
    hmUI.setLayerScrolling(true)
    fill(0, 0, 466, 466, C.bg)

    // ── PROBE STORAGE b4 (baca AGENTS §0: @zos/storage belum pernah terbukti
    // load/jalan di watch ini — ini pembuktiannya, difoto Ahmed) ──
    var probeMsg = BUILD + ' S?'
    try {
      var lr = storeGet('lastRead')
      storeSet('lastRead', (lr && lr.surah) ? lr : { surah: 1, ayah: 1, page: 1, ts: 0 })
      var lr2 = storeGet('lastRead')
      probeMsg = (lr2 && lr2.surah)
        ? BUILD + ' STORAGE OK (s' + lr2.surah + ':a' + lr2.ayah + ')'
        : BUILD + ' STORAGE BACA GAGAL'
    } catch (e) {
      probeMsg = BUILD + ' STORAGE ERR: ' + e
    }
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: px(280), w: px(386), h: px(90), color: C.gold,
      text_size: px(24), text: probeMsg,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP,
    })

    const surahIndex = getSurahIndex()
    if (!surahIndex || surahIndex.length === 0) {
      label('No surah data', px(50), px(180), px(366), px(60), C.gold, 28)
      return
    }

    // Header
    const hdrY = px(12), hdrH = px(48)

    var backBtn = fill(px(16), hdrY, px(44), hdrH, C.surface)
    backBtn.addEventListener(hmUI.event.CLICK_DOWN, function () { back() })
    label('←', px(16), hdrY, px(44), hdrH, C.textHi, px(34))

    const titleW = safeWidth(hdrY + px(6), hdrH, 380)
    label('114 Surah', centerX(titleW), hdrY + px(6), titleW, hdrH, C.gold, px(34))

    const divY = hdrY + hdrH + px(4)
    const divW = safeWidth(divY, px(2))
    fill(centerX(divW), divY, divW, px(2), C.stroke)

    // SCROLL_LIST
    const listY = divY + px(6)
    const listH = px(340)
    const listW = safeWidth(listY, listH, 396)
    const itemH = px(56)

    const listData = surahIndex.map(function (s) {
      return {
        num: s.nomor,
        nameAr: s.nama,
        nameLatin: s.namaLatin,
        ayatCount: s.jumlahAyat,
        tempatTurun: s.tempatTurun,
      }
    })

    hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
      x: centerX(listW), y: listY, w: listW, h: listH,
      item_size: itemH, item_gap: px(6),
      data_count: listData.length,
      data_array: listData,
      data_size: listData.length * (itemH + px(6)),
      item_config: [
        {
          type: 'TEXT',
          text: function (item) { return item.num.toString() },
          x: px(12), y: px(4), w: px(40), h: itemH - px(8),
          color: C.gold, text_size: 30,
          align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
        },
        {
          type: 'TEXT',
          text: function (item) { return item.nameLatin },
          x: px(56), y: px(4), w: listW - px(120), h: px(26),
          color: C.textHi, text_size: 24,
          align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
          text_style: hmUI.text_style.WRAP,
        },
        {
          type: 'TEXT',
          text: function (item) { return item.nameAr },
          x: px(56), y: px(28), w: listW - px(120), h: px(22),
          color: C.textMd, text_size: 24,
          align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
          text_style: hmUI.text_style.WRAP,
        },
        {
          type: 'TEXT',
          text: function (item) { return '' + item.ayatCount },
          x: listW - px(56), y: px(4), w: px(48), h: itemH - px(8),
          color: C.textLo, text_size: 24,
          align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
        },
      ],
      item_click_func: function (item) {
        push({ url: 'page/reader', params: { surahNum: item.num } })
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
