// Prayer time calculation engine — Batch H (Jadwal Sholat)
// Pure JS, no Zepp dependencies. Reused by Batch J (Qibla) for location.
//
// Algorithm: standard solar-declination + equation-of-time method.
// Verified against: NOAA Solar Calculator + Kemenag published tables.
// Precision target: ±1 minute (astronomical) + 2 min ihtiyat = max ±2 min vs Kemenag.
//
// REFERENCES:
//  - Spencer, J.W. (1971) — Fourier series for solar declination & EoT
//  - Kemenag RI — Fajr 20°, Isha 18°, ihtiyat +2 menit
//  - Shafi'i madhab — Asr shadow factor 1× (bayangan 1× tinggi benda)

// ═══════════════════════════════════════════
// CONSTANTS — single source for location
// ═══════════════════════════════════════════

/** Default location (Bogor). Used by Batch H prayer + Batch J Qibla. DO NOT DUPLICATE. */
export const LOCATION = {
  lat: -6.595,
  lon: 106.816,
  tz: 7,         // UTC+7 (WIB, no DST)
  city: 'Bogor',
}

// ═══════════════════════════════════════════
// Calculation methods
// ═══════════════════════════════════════════

export const METHODS = {
  kemenag:  { fajr: 20, isha: 18 },
  mwl:      { fajr: 18, isha: 17 },
  isna:     { fajr: 15, isha: 15 },
  egypt:    { fajr: 19.5, isha: 17.5 },
  karachi:  { fajr: 18, isha: 18 },
  uaq:      { fajr: 18.5, isha: 90 },     // Umm al-Qura: Isha fixed 90 min after Maghrib (special-cased in calc)
}

export const MADHAB = {
  shafii: 1,    // shadow = 1× object height at Asr
  hanafi: 2,    // shadow = 2× object height at Asr
}

var IHTIYAT = 2   // Kemenag: +2 minutes safety margin

// ═══════════════════════════════════════════
// Astronomy helpers (pure math)
// ═══════════════════════════════════════════

function DEG(x)  { return x * 180 / Math.PI }
function RAD(x)  { return x * Math.PI / 180 }
function sind(x) { return Math.sin(RAD(x)) }
function cosd(x) { return Math.cos(RAD(x)) }
function tand(x) { return Math.tan(RAD(x)) }
function arcsind(x) { return DEG(Math.asin(x)) }
function arccosd(x) { return DEG(Math.acos(x)) }
function arctand(x) { return DEG(Math.atan(x)) }

/** Day of year (1=Jan 1, 365/366=Dec 31). */
function dayOfYear(date) {
  var y = date.getFullYear()
  var m = date.getMonth() + 1
  var d = date.getDate()
  var k = (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 1 : 2
  // Month-length lookup: the k-th entry in the month-days array depends on Feb
  var md = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  var n = d
  for (var i = 0; i < m; i++) { n += md[i] }
  if (m > 2) { n += (k === 1 ? 1 : 0) } // Feb has 29 in leap year
  return n
}

// ═══════════════════════════════════════════
// Solar position (Spencer 1971 Fourier series)
// ═══════════════════════════════════════════

/**
 * Solar declination (radians) + Equation of Time (minutes).
 * Spencer's Fourier coefficients, accurate to ±0.01° declination, ±1 min EoT.
 * @param {number} n — day of year (1-365/366)
 * @returns {{ dec: number, eot: number }} declination in radians, EoT in minutes
 */
function solarPosition(n) {
  var gamma = 2 * Math.PI * (n - 1) / 365  // fractional year angle

  // Declination (radians) — Spencer eq. (1)
  var dec = 0.006918
    - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.001480 * Math.sin(3 * gamma)

  // Equation of Time (minutes) — Spencer eq. (2), factor 229.18 converts rad→min
  var eot = 229.18 * (
      0.000075
    + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma)
  )

  return { dec: dec, eot: eot }
}

// ═══════════════════════════════════════════
// Hour angle for a given sun altitude
// ═══════════════════════════════════════════

/**
 * Compute the hour angle (in hours) for a given solar altitude.
 * cos(ω) = (sin(α) - sin(φ)·sin(δ)) / (cos(φ)·cos(δ))
 * If |cos(ω)| > 1, the sun never reaches that altitude — returns 0 (polar day/night).
 *
 * @param {number} altDeg — target sun altitude in degrees (negative = below horizon)
 * @param {number} latDeg — observer latitude
 * @param {number} decRad — solar declination in radians
 * @returns {number} hour angle in hours (always non-negative)
 */
function hourAngle(altDeg, latDeg, decRad) {
  var num = sind(altDeg) - sind(latDeg) * Math.sin(decRad)
  var den = cosd(latDeg) * Math.cos(decRad)
  var cosH = num / den
  if (cosH > 1) return 0     // sun never reaches that altitude (polar night)
  if (cosH < -1) return 12   // sun never drops below (polar day)
  return arccosd(cosH) / 15  // hours
}

// ═══════════════════════════════════════════
// Asr altitude angle
// ═══════════════════════════════════════════

/**
 * Sun altitude at Asr time for a given madhab.
 * Shafi'i: arccot(1 + tan(|lat - dec|)) — shadow = object height + noon shadow
 * Hanafi: arccot(2 + tan(|lat - dec|)) — shadow = 2× object height + noon shadow
 *
 * @param {number} latDeg — latitude
 * @param {number} decRad — declination in radians
 * @param {number} shadow — shadow factor (1=Shafi'i, 2=Hanafi)
 * @returns {number} sun altitude in degrees
 */
function asrAltitude(latDeg, decRad, shadow) {
  var decDeg = DEG(decRad)
  var noonShadow = Math.abs(tand(latDeg - decDeg))
  var cotAlt = shadow + noonShadow
  if (cotAlt <= 0) return 0  // edge case: near poles
  return arctand(1 / cotAlt)
}

// ═══════════════════════════════════════════
// Main calculation
// ═══════════════════════════════════════════

/**
 * Calculate all 6 prayer times for a given date and location.
 *
 * @param {Date} date — JS Date (local time)
 * @param {object} loc — {lat, lon, tz} (use LOCATION for Bogor)
 * @param {object} method — {fajr, isha} sun-depression angles
 * @param {number} madhab — MADHAB.shafii (1) or MADHAB.hanafi (2)
 * @param {number} ihtiyat — extra minutes added to each time (default 2)
 * @returns {{ subuh:string, terbit:string, dzuhur:string, ashar:string, maghrib:string, isya:string }}
 *          All times in HH:MM (24h, local timezone).
 */
export function calculate(date, loc, method, madhab, ihtiyat) {
  if (!loc) loc = LOCATION
  if (!method) method = METHODS.kemenag
  if (madhab == null) madhab = MADHAB.shafii
  if (ihtiyat == null) ihtiyat = IHTIYAT

  var lat = loc.lat
  var lon = loc.lon
  var tz = loc.tz

  var n = dayOfYear(date)
  var sp = solarPosition(n)
  var dec = sp.dec
  var eot = sp.eot

  // ── Dhuhr (solar noon at this longitude, local time) ──
  // At standard meridian (tz*15°), noon = 12:00 local.
  // For longitude λ east of standard meridian, noon is earlier by (λ/15 - tz) hours.
  // EoT positive → sun ahead → noon earlier.
  var dhuhrHrs = 12 + tz - lon / 15 - eot / 60

  // ── Hour angles ──
  var tFajr    = hourAngle(-method.fajr, lat, dec)     // sun -fajr° below horizon
  var tSunrise = hourAngle(-0.833, lat, dec)            // top of sun at horizon
  var tMaghrib = hourAngle(-0.833, lat, dec)            // = tSunrise (same altitude)
  var tIsha    = hourAngle(-method.isha, lat, dec)      // sun -isha° below horizon

  // Umm al-Qura special case: Isha = fixed 90 min after Maghrib
  if (method.isha >= 90) {
    tIsha = tMaghrib + 90 / 60  // +90 minutes
  }

  var altAsr = asrAltitude(lat, dec, madhab)
  var tAsr = hourAngle(altAsr, lat, dec)

  // ── Raw times in hours (local) ──
  var subuhRaw   = dhuhrHrs - tFajr
  var terbitRaw  = dhuhrHrs - tSunrise
  var dzuhurRaw  = dhuhrHrs
  var asharRaw   = dhuhrHrs + tAsr
  var maghribRaw = dhuhrHrs + tMaghrib
  var isyaRaw    = dhuhrHrs + tIsha

  // ── Ihtiyat (safety margin) + round to nearest minute ──
  // `margin` overrides ihtiyat per-time: terbit (sunrise) passes 0 — only the 5
  // obligatory prayers take the +2 min safety margin (Kemenag convention: sunrise
  // is astronomical, not a prayer time, so no ihtiyat is added).
  function toHHMM(hrs, margin) {
    var add = (margin == null) ? ihtiyat : margin
    var totalMin = Math.round(hrs * 60 + add)
    // Clamp to [0, 1439] (24h range) — handles rare edge cases near date line
    totalMin = ((totalMin % 1440) + 1440) % 1440
    var h = Math.floor(totalMin / 60)
    var m = totalMin % 60
    if (h < 10) h = '0' + h
    if (m < 10) m = '0' + m
    return h + ':' + m
  }

  return {
    subuh:   toHHMM(subuhRaw),
    terbit:  toHHMM(terbitRaw, 0),   // sunrise: NO ihtiyat (only the 5 obligatory prayers get +2)
    dzuhur:  toHHMM(dzuhurRaw),
    ashar:   toHHMM(asharRaw),
    maghrib: toHHMM(maghribRaw),
    isya:    toHHMM(isyaRaw),
  }
}

// ═══════════════════════════════════════════
// Convenience helpers
// ═══════════════════════════════════════════

/**
 * Convert "HH:MM" to minutes since midnight (0-1439).
 */
export function toMinutes(hhmm) {
  var parts = String(hhmm).split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

/**
 * Given a prayer-times object and current time (minutes since midnight),
 * return {name, time} of the NEXT prayer. If all prayers today have passed,
 * returns {name: 'subuh', time: <tomorrow's subuh>}.
 *
 * @param {object} times — {subuh, terbit, dzuhur, ashar, maghrib, isya} HH:MM
 * @param {number} nowMin — current time in minutes since midnight (local)
 * @param {object} loc — location (for calculating tomorrow's subuh if needed)
 * @param {object} method — calculation method
 * @returns {{ name: string, time: string }}
 */
export function nextPrayer(times, nowMin, loc, method) {
  // 'terbit' (sunrise) is informational only — NOT an obligatory prayer — so it is
  // excluded from next-prayer candidates and can never be highlighted as "next".
  var ORDER = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']

  for (var i = 0; i < ORDER.length; i++) {
    var t = toMinutes(times[ORDER[i]])
    if (t > nowMin) {
      return { name: ORDER[i], time: times[ORDER[i]] }
    }
  }

  // All prayers today have passed → next is tomorrow's Subuh
  var tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  var tomorrowTimes = calculate(tomorrow, loc || LOCATION, method || METHODS.kemenag, MADHAB.shafii, IHTIYAT)
  return { name: 'subuh', time: tomorrowTimes.subuh }
}

/**
 * Get human-readable prayer name (Arabic).
 */
export function prayerName(key) {
  var NAMES = {
    subuh: 'صبح',
    terbit: 'شروق',
    dzuhur: 'ظهر',
    ashar: 'عصر',
    maghrib: 'مغرب',
    isya: 'عشاء',
  }
  return NAMES[key] || key
}

/**
 * Get prayer name in Latin/Indonesian.
 */
export function prayerNameId(key) {
  var NAMES = {
    subuh: 'Subuh',
    terbit: 'Terbit',
    dzuhur: 'Dzuhur',
    ashar: 'Ashar',
    maghrib: 'Maghrib',
    isya: 'Isya',
  }
  return NAMES[key] || key
}
