// Shared location module — Batch H (prayer), reused by Batch J (Qibla) & Batch N (settings).
// SINGLE source of truth for the active prayer location. Do NOT duplicate this logic
// into prayer-calc.js, qibla, or settings — import from here.
//
// Storage: store key 'location' (qp.location.v1). Schema: {mode, cityId, lat, lon, city, ts}.
//   mode 'manual' → lat/lon/city/cityId from a preset; 'auto' → lat/lon from GPS, city=''.
//
// TIMEZONE: derived live from the watch system clock (getCurrentTz), NOT looked up from
// lat/lon. The watch is timezone-synced from the paired phone — the most accurate source,
// and it avoids wrong-zone guesses near zone borders. tz is computed at call time and
// attached to the returned location object (the astronomy engine reads loc.tz).

import { get as storeGet, set as storeSet } from './store'

// Preset cities across Indonesia's 3 time zones. tz is NOT stored per city — it is read
// live from the system clock (a watch in WITA returns tz=8 regardless of which city is
// selected, which is correct: prayer times are computed in the watch's local clock).
// Grouped by zone for documentation; the array order = UI list order.
export const PRESET_CITIES = [
  // WIB (UTC+7)
  { id: 'bogor', name: 'Bogor', lat: -6.595, lon: 106.816 },
  { id: 'jakarta', name: 'Jakarta', lat: -6.209, lon: 106.846 },
  { id: 'bandung', name: 'Bandung', lat: -6.917, lon: 107.619 },
  { id: 'surabaya', name: 'Surabaya', lat: -7.250, lon: 112.752 },
  { id: 'yogyakarta', name: 'Yogyakarta', lat: -7.795, lon: 110.369 },
  { id: 'medan', name: 'Medan', lat: 3.595, lon: 98.672 },
  { id: 'padang', name: 'Padang', lat: -0.949, lon: 100.354 },
  // WITA (UTC+8)
  { id: 'makassar', name: 'Makassar', lat: -5.147, lon: 119.432 },
  { id: 'denpasar', name: 'Denpasar', lat: -8.670, lon: 115.212 },
  { id: 'palopo', name: 'Palopo', lat: -2.988, lon: 120.193 },
  // WIT (UTC+9)
  { id: 'jayapura', name: 'Jayapura', lat: -2.533, lon: 140.718 },
  { id: 'ambon', name: 'Ambon', lat: -3.695, lon: 128.181 },
]

var DEFAULT_CITY = PRESET_CITIES[0] // Bogor

/**
 * System timezone offset in hours (7 = WIB, 8 = WITA, 9 = WIT).
 * Primary: new Date().getTimezoneOffset() (returns -min-from-UTC). Fallback (if the
 * runtime does not expose tz that way) derives it from local-vs-UTC hours.
 */
export function getCurrentTz() {
  var d = new Date()
  var off = -d.getTimezoneOffset() / 60
  if (!off || isNaN(off)) {
    var diff = d.getHours() - d.getUTCHours()
    if (diff < -12) diff += 24
    if (diff > 12) diff -= 24
    off = diff
  }
  return off
}

function presetById(id) {
  for (var i = 0; i < PRESET_CITIES.length; i++) {
    if (PRESET_CITIES[i].id === id) return PRESET_CITIES[i]
  }
  return null
}

/**
 * Active location: {mode, cityId, lat, lon, city, tz}.
 * tz is computed live from the system clock (not stored). Falls back to the Bogor
 * preset when nothing valid is stored, so the engine always gets sane coordinates.
 */
export function getLocation() {
  var raw = storeGet('location') || {}
  var tz = getCurrentTz()

  if (raw && raw.mode === 'manual' && raw.cityId) {
    var p = presetById(raw.cityId)
    if (p) return { mode: 'manual', cityId: p.id, lat: p.lat, lon: p.lon, city: p.name, tz: tz }
  }
  if (raw && raw.mode === 'auto' && typeof raw.lat === 'number' && typeof raw.lon === 'number') {
    return { mode: 'auto', cityId: '', lat: raw.lat, lon: raw.lon, city: '', tz: tz }
  }
  // Default: Bogor preset
  return { mode: 'manual', cityId: DEFAULT_CITY.id, lat: DEFAULT_CITY.lat, lon: DEFAULT_CITY.lon, city: DEFAULT_CITY.name, tz: tz }
}

/** Set location to a preset city by id. Returns the resolved city name, or null if unknown. */
export function setLocationManual(cityId) {
  var p = presetById(cityId)
  if (!p) {
    console.log('[location] unknown cityId: ' + cityId)
    return null
  }
  storeSet('location', { mode: 'manual', cityId: p.id, lat: p.lat, lon: p.lon, city: p.name, ts: Date.now() })
  console.log('[location] manual -> ' + p.name)
  return p.name
}

/** Set location to GPS coordinates (mode 'auto'). */
export function setLocationAuto(lat, lon) {
  storeSet('location', { mode: 'auto', cityId: '', lat: lat, lon: lon, city: '', ts: Date.now() })
  console.log('[location] auto -> ' + lat + ', ' + lon)
}

/** Human label for a location object (defaults to active). */
export function locationLabel(loc) {
  if (!loc) loc = getLocation()
  return loc.mode === 'auto' ? 'Lokasi GPS' : (loc.city || 'Bogor')
}
