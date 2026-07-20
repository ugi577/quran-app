// Qibla bearing calculation — pure JS, no Zepp dependencies.
// Reused by Batch J (Qibla page) and potentially Batch N (Settings).
//
// The bearing is the great-circle initial bearing from the user's position
// to the Kaaba in Makkah. Formula verified: Bogor → ~295° (northwest).

// Kaaba coordinates — FROZEN, do not change.
export const KAABA_LAT = 21.4225
export const KAABA_LON = 39.8262

/**
 * Great-circle bearing from (lat, lon) to Kaaba.
 * @param {number} lat — user latitude in degrees
 * @param {number} lon — user longitude in degrees
 * @returns {number} bearing 0–360°, clockwise from true north
 */
export function bearingToKaaba(lat, lon) {
  var φ1 = lat * Math.PI / 180
  var λ1 = lon * Math.PI / 180
  var φ2 = KAABA_LAT * Math.PI / 180
  var λ2 = KAABA_LON * Math.PI / 180

  var Δλ = λ2 - λ1

  var y = Math.sin(Δλ) * Math.cos(φ2)
  var x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  var θ = Math.atan2(y, x) * 180 / Math.PI
  return (θ + 360) % 360
}

/**
 * Distance (haversine) from user to Kaaba in metres. Useful for display or
 * future distance-based hints (e.g. "~7000 km ke Ka'bah").
 * @param {number} lat
 * @param {number} lon
 * @returns {number} distance in km
 */
export function distanceToKaaba(lat, lon) {
  var R = 6371 // earth radius in km
  var φ1 = lat * Math.PI / 180
  var φ2 = KAABA_LAT * Math.PI / 180
  var Δφ = φ2 - φ1
  var Δλ = (KAABA_LON - lon) * Math.PI / 180

  var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

/**
 * Cardinal direction label in Indonesian from bearing (0–360).
 * @param {number} deg
 * @returns {string} 'U' | 'TL' | 'T' | 'TG' | 'S' | 'BD' | 'B' | 'BL'
 */
export function directionLabel(deg) {
  var dirs = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL']
  var i = Math.round(deg / 45) % 8
  return dirs[i]
}
