// Qibla bearing + angle math — pure JS, no Zepp dependencies.
// Reused by Batch J (Qibla page) and potentially Batch N (Settings).
//
// The bearing is the great-circle initial bearing from the user's position
// to the Kaaba in Makkah. Formula verified: Bogor → ~295° (northwest).
//
// b41: merged in magneticDeclination / norm / angleDiff / turnDirection from
// the Batch-J redesign utils (Indonesia declination table + turn hints).
// bearingToKaaba & distanceToKaaba formulas were byte-identical to the redesign's
// qiblaBearing/distanceToKaaba, so they were KEPT (tertashih, 295° Bogor verified)
// — not duplicated.

// Kaaba coordinates — FROZEN, do not change.
export const KAABA_LAT = 21.4225
export const KAABA_LON = 39.8262

var RAD = Math.PI / 180

/** Great-circle bearing from (lat, lon) to Kaaba, 0–360° clockwise from true north. */
export function bearingToKaaba(lat, lon) {
  var φ1 = lat * RAD
  var φ2 = KAABA_LAT * RAD
  var Δλ = (KAABA_LON - lon) * RAD

  var y = Math.sin(Δλ) * Math.cos(φ2)
  var x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  return norm(Math.atan2(y, x) / RAD)
}

/** Distance (haversine) from user to Kaaba in km. */
export function distanceToKaaba(lat, lon) {
  var R = 6371 // earth radius in km
  var φ1 = lat * RAD
  var φ2 = KAABA_LAT * RAD
  var Δφ = (KAABA_LAT - lat) * RAD
  var Δλ = (KAABA_LON - lon) * RAD

  var sφφ = Math.sin(Δφ / 2)
  var sλλ = Math.sin(Δλ / 2)
  var a = sφφ * sφφ + Math.cos(φ1) * Math.cos(φ2) * sλλ * sλλ
  return Math.round(2 * R * Math.asin(Math.sqrt(a)))
}

/** Cardinal direction label in Indonesian from bearing (0–360). */
export function directionLabel(deg) {
  var dirs = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL']
  return dirs[Math.round(norm(deg) / 45) % 8]
}

/** Bring any angle into 0–360. */
export function norm(a) {
  return ((a % 360) + 360) % 360
}

/** Shortest circular difference between two angles, result 0–180. */
export function angleDiff(a, b) {
  var d = Math.abs(norm(a) - norm(b)) % 360
  return d > 180 ? 360 - d : d
}

/**
 * Nearest turn from `heading` toward `target`.
 * Positive = turn right (clockwise), negative = turn left.
 */
export function turnDirection(heading, target) {
  return ((norm(target) - norm(heading) + 540) % 360) - 180
}

/**
 * Rough magnetic-declination correction for Indonesia.
 * The compass sensor returns MAGNETIC north; qibla bearing is TRUE north.
 * true_heading = magnetic_heading + declination
 *
 * Values are a regional approximation (epoch ~2025, IGRF). Full accuracy needs
 * the WMM model — beyond the watch — so we use nearest-city interpolation and
 * still surface the degree number so the user can verify.
 */
var DECL_TABLE = [
  // [lat, lon, declination East(+)/West(-)]
  [5.5, 95.3, -0.2],   // Banda Aceh
  [3.6, 98.7, 0.0],    // Medan
  [-0.9, 100.4, 0.4],  // Padang
  [-6.2, 106.8, 0.8],  // Jakarta / Bogor
  [-7.0, 110.4, 1.0],  // Semarang
  [-7.3, 112.7, 1.2],  // Surabaya
  [-8.7, 115.2, 1.4],  // Denpasar
  [-5.1, 119.4, 1.3],  // Makassar
  [-2.6, 121.4, 1.4],  // Luwu Timur
  [1.5, 124.8, 0.9],   // Manado
  [-3.7, 128.2, 2.0],  // Ambon
  [-2.5, 140.7, 4.5],  // Jayapura
]

export function magneticDeclination(lat, lon) {
  var best = 0
  var bestD = Infinity
  for (var i = 0; i < DECL_TABLE.length; i++) {
    var row = DECL_TABLE[i]
    var d = (row[0] - lat) * (row[0] - lat) + (row[1] - lon) * (row[1] - lon)
    if (d < bestD) {
      bestD = d
      best = row[2]
    }
  }
  return best
}
