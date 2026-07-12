// UI Components for Quran Premium
// DESIGN-SYSTEM.md §4 — Shape, spacing, motion

import { createWidget, widget, align } from '@zos/ui'
import { px } from '@zos/utils'
import { C, F } from './theme.js'
import { safeWidth, centerX, safeCenterX } from './layout.js'

/**
 * Header component — screen title at top
 * @param {Object} opts - { text, y }
 */
export function Header(opts = {}) {
  const { text = '', y = 40 } = opts
  const w = safeWidth(y, px(F.h2), 380)

  return createWidget(widget.TEXT, {
    x: centerX(w),
    y: y,
    w: w,
    h: px(F.h2),
    color: C.gold,
    text_size: F.h2,
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text: text,
  })
}

/**
 * Card component — tappable card with label and value
 * @param {Object} opts - { y, label, value, color, onPress }
 */
export function Card(opts = {}) {
  const { y = 0, label = '', value = '', color = C.textHi, onPress = null } = opts
  const cardH = px(80)
  const cardW = safeWidth(y, cardH)

  const props = {
    x: centerX(cardW),
    y: y,
    w: cardW,
    h: cardH,
    radius: 12,
    color: C.surface,
  }

  const card = createWidget(widget.FILL_RECT, props)

  // Label (top small)
  createWidget(widget.TEXT, {
    x: props.x + px(16),
    y: y + px(12),
    w: cardW - px(32),
    h: px(F.label),
    color: C.goldDim,
    text_size: F.label,
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text: label,
  })

  // Value (bottom large)
  createWidget(widget.TEXT, {
    x: props.x + px(16),
    y: y + px(44),
    w: cardW - px(32),
    h: px(F.body),
    color: color,
    text_size: F.body,
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: 1, // WRAP
    text: value,
  })

  // Tap handler
  if (onPress) {
    createWidget(widget.BUTTON, {
      ...props,
      color: 0x000000, // Transparent
      normal_color: [0, 0, 0, 0],
      press_color: [0, 0, 0, 0],
      text: '',
      click_func: onPress,
    })
  }

  return card
}

/**
 * ListRow component — row in scrollable list
 * @param {Object} opts - { y, num, titleLeft, titleRight, onPress }
 */
export function ListRow(opts = {}) {
  const { y = 0, num = '', titleLeft = '', titleRight = '', onPress = null } = opts
  const rowH = px(56)
  const rowW = safeWidth(y, rowH)

  const props = {
    x: centerX(rowW),
    y: y,
    w: rowW,
    h: rowH,
    radius: 8,
    color: C.surface,
  }

  // Background
  createWidget(widget.FILL_RECT, props)

  // Number (left)
  if (num) {
    createWidget(widget.TEXT, {
      x: props.x + px(16),
      y: y + px(8),
      w: px(40),
      h: px(40),
      color: C.gold,
      text_size: F.bodyLg,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: num,
    })
  }

  // Title left (after number)
  const titleLeftW = rowW - px(80)
  createWidget(widget.TEXT, {
    x: props.x + px(64),
    y: y + px(8),
    w: titleLeftW,
    h: px(40),
    color: C.textHi,
    text_size: F.bodyLg,
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: 1, // WRAP
    text: titleLeft,
  })

  // Title right (end of row, optional)
  if (titleRight) {
    createWidget(widget.TEXT, {
      x: props.x + rowW - px(56),
      y: y + px(8),
      w: px(48),
      h: px(40),
      color: C.textMd,
      text_size: F.label,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: titleRight,
    })
  }

  // Tap handler
  if (onPress) {
    createWidget(widget.BUTTON, {
      ...props,
      color: 0x000000,
      normal_color: [0, 0, 0, 0],
      press_color: [0, 0, 0, 0],
      text: '',
      click_func: onPress,
    })
  }

  return props
}
