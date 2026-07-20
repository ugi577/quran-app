// Hijri (Islamic lunar) date conversion — Batch H (Jadwal Sholat header)
// Pure JS, no dependencies (same style as page/prayer-calc.js).
//
// Algorithm: tabular Islamic calendar (a.k.a. "Kuwaiti algorithm") — integer
// arithmetic on the Julian Day Number. Reused (not reinvented) from the proven
// converter in Ahmed's mahad-askar-app-v2 (node_modules/hijri-date GregToIsl),
// which itself is the standard tabular method used across JS Hijri libraries.
//
// IMPORTANT — accuracy caveat:
//   The tabular calendar is a fixed arithmetic approximation. The dates Muslims
//   actually follow are based on RUKYAT (hilal sighting) / imkanur rukyat, which
//   can differ from pure hisab by ±1 day. So HIJRI_OFFSET lets us nudge the
//   result to match the local reference (Kemenag/NU for Indonesia). Verify the
//   offset against a published Hijri calendar for the current season and adjust.
//
// Reference epoch: 1 Muharram 1 AH ≈ JD 1948439.5 (16 July 622 CE, proleptic).

// Manual day offset to align tabular hisab with local rukyat-based calendars.
//   0 = pure tabular. +1 / -1 to match Kemenag-NU if the tabular result drifts.
//   Currently +1: pure tabular gives 5 Safar 1448 for 2026-07-21, but Kemenag/NU
//   publishes 6 Safar 1448 (imkanur rukyat starts Safar one day earlier). Verified
//   2026-07-21. Re-check at future month boundaries (esp. Rajab→Sya'ban→Ramadhan),
//   where hisab vs rukyat can diverge by a day — adjust this constant then.
export var HIJRI_OFFSET = 1

// Indonesian Hijri month names (1-indexed; index 0 unused).
var BULAN_HIJRI = [
  '', 'Muharram', 'Safar', 'Rabiul Awwal', 'Rabiul Akhir',
  'Jumadil Awwal', 'Jumadil Akhir', 'Rajab', "Sya'ban",
  'Ramadhan', 'Syawal', 'Zulkaidah', 'Zulhijjah',
]

/** Truncate toward zero with a tiny epsilon to absorb float error. */
function intPart(x) {
  if (x < -0.0000001) return Math.ceil(x - 0.0000001)
  return Math.floor(x + 0.0000001)
}

/**
 * Gregorian (Y/M/D) → Hijri {tanggal, bulan, tahun}. Tabular algorithm.
 * `delta` is the per-call offset (0 here; HIJRI_OFFSET is applied by shifting
 * the input date in gregToHijri, which is equivalent and keeps this pure).
 */
function convert(d, m, y) {
  var jd
  if (y > 1582 || (y === 1582 && m > 10) || (y === 1582 && m === 10 && d > 14)) {
    jd = intPart(1461 * (y + 4800 + intPart((m - 14) / 12)) / 4)
      + intPart(367 * (m - 2 - 12 * intPart((m - 14) / 12)) / 12)
      - intPart(3 * intPart((y + 4900 + intPart((m - 14) / 12)) / 100) / 4)
      + d - 32075
  } else {
    // Proleptic Julian calendar (pre-1582); irrelevant for modern dates but kept
    // for completeness of the algorithm.
    jd = 367 * y - intPart(7 * (y + 5001 + intPart((m - 9) / 7)) / 4)
      + intPart(275 * m / 9) + d + 1729777
  }

  var l = jd - 1948440 + 10632
  var n = intPart((l - 1) / 10631)
  l = l - 10631 * n + 354
  var j = intPart((10985 - l) / 5316) * intPart(50 * l / 17719)
    + intPart(l / 5670) * intPart(43 * l / 15238)
  l = l - intPart((30 - j) / 15) * intPart(17719 * j / 50)
    - intPart(j / 16) * intPart(15238 * j / 43) + 29
  var bulan = intPart(24 * l / 709)
  var tanggal = l - intPart(709 * bulan / 24)
  var tahun = 30 * n + j - 30

  return { tanggal: tanggal, bulan: bulan, tahun: tahun }
}

/**
 * Convert a JS Date to a Hijri date, applying HIJRI_OFFSET (rukya alignment).
 * Uses the DATE part only (local Y/M/D), ignoring time-of-day.
 * @param {Date} date
 * @returns {{ tanggal: number, bulan: number, tahun: number }}
 */
export function gregToHijri(date) {
  // Shift by HIJRI_OFFSET days (equivalent to offsetting the Hijri result by the
  // same number of days). Clone so we never mutate the caller's Date.
  var d = new Date(date.getTime())
  d.setDate(d.getDate() + HIJRI_OFFSET)
  return convert(d.getDate(), d.getMonth() + 1, d.getFullYear())
}

/**
 * Format a JS Date as an Indonesian Hijri string, e.g. "19 Muharram 1448 H".
 * @param {Date} date
 * @returns {string}
 */
export function formatHijri(date) {
  var h = gregToHijri(date)
  return h.tanggal + ' ' + BULAN_HIJRI[h.bulan] + ' ' + h.tahun + ' H'
}

/** Expose month names (1-indexed) for callers that need the raw label. */
export function hijriMonthName(bulan) {
  return BULAN_HIJRI[bulan] || ''
}
