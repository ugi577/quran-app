// Navigation wrapper for @zos/router
// DESIGN-SYSTEM.md: Right-swipe is system back — NEVER intercept GESTURE_RIGHT

import { router } from '@zos/router'

/**
 * Push a new page onto the stack.
 * @param {string} url - Page URL (e.g., 'page/reader')
 * @param {Object} params - Params to pass to the page
 */
export function push(url, params = {}) {
  router.push(url, params)
}

/**
 * Replace current page (no back).
 * @param {string} url - Page URL
 * @param {Object} params - Params to pass
 */
export function replace(url, params = {}) {
  router.replace(url, params)
}

/**
 * Go back to previous page.
 */
export function back() {
  router.back()
}

/**
 * Go back to home (clear stack).
 */
export function home() {
  router.home()
}

/**
 * Exit the app.
 */
export function exit() {
  router.exit()
}

/**
 * BasePage helper pattern.
 * Wraps page lifecycle with proper cleanup.
 *
 * Usage in page:
 * ```js
 * import { BasePage } from 'zosLoader:../../src/ui/nav.js'
 *
 * BasePage({
 *   onInit() { ... },
 *   build() { ... },
 *   onDestroy() {
 *     // Stop timers, sensors here
 *   }
 * })
 * ```
 */
export function BasePage(handlers = {}) {
  const {
    onInit = () => {},
    build = () => {},
    onDestroy = () => {},
  } = handlers

  // Track timers/sensors for cleanup
  let timers = []
  let sensors = []

  const wrappedPage = {
    onInit() {
      console.log(`[Page] onInit`)
      onInit.call(this)
    },

    build() {
      console.log(`[Page] build`)
      build.call(this)
    },

    onDestroy() {
      console.log(`[Page] onDestroy — cleaning up`)
      // Stop all tracked timers
      timers.forEach(t => {
        if (t) clearInterval(t)
      })
      timers = []

      // Stop all tracked sensors
      sensors.forEach(s => {
        if (s && s.stop) s.stop()
      })
      sensors = []

      onDestroy.call(this)
    },
  }

  // Register timer helper
  wrappedPage.$setTimer = (fn, interval) => {
    const t = setInterval(fn, interval)
    timers.push(t)
    return t
  }

  // Register sensor helper
  wrappedPage.$registerSensor = (sensor) => {
    sensors.push(sensor)
    return sensor
  }

  return wrappedPage
}
