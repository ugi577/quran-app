// Prayer time calculation — Kemenag RI method
// Fajr: 20°, Isha: 18°, Asar: Shafi'i (shadow ratio 1)

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function julianDate(year, month, day) {
  if (month <= 2) { year -= 1; month += 12; }
  var A = Math.floor(year / 100);
  var B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunPosition(jd) {
  var n = jd - 2451545.0;
  var L = (280.460 + 0.9856474 * n) % 360;
  var g = toRad((357.528 + 0.9856003 * n) % 360);
  var lambda = toRad(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  var epsilon = toRad(23.439 - 0.0000004 * n);
  var sinDec = Math.sin(epsilon) * Math.sin(lambda);
  var decl = Math.asin(sinDec);
  // Equation of time (minutes)
  var RA = toDeg(Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda))) / 15;
  var GMST = (6.697375 + 0.0657098242 * n) % 24;
  var eot = (GMST - RA - 12) * 60;
  while (eot > 20) eot -= 1440 / 60;
  while (eot < -20) eot += 1440 / 60;
  return { decl: decl, eot: eot };
}

function hourAngle(lat, decl, altitude) {
  var latR = toRad(lat);
  var cosH = (Math.sin(toRad(altitude)) - Math.sin(latR) * Math.sin(decl))
             / (Math.cos(latR) * Math.cos(decl));
  if (cosH < -1) return 180;
  if (cosH > 1)  return 0;
  return toDeg(Math.acos(cosH));
}

function asarAngle(lat, decl) {
  // Shafi'i: shadow = 1× object height
  var latR = toRad(lat);
  var alt = toDeg(Math.atan(1 / (1 + Math.tan(Math.abs(latR - decl)))));
  return alt;
}

function minsToHHMM(mins) {
  var total = Math.round(mins);
  while (total < 0)    total += 1440;
  while (total >= 1440) total -= 1440;
  var h = Math.floor(total / 60);
  var m = total % 60;
  return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
}

/**
 * Calculate prayer times.
 * @param {number} lat      Latitude (degrees)
 * @param {number} lng      Longitude (degrees)
 * @param {Object} dateObj  { year, month, day }
 * @param {number} timezone Offset from UTC in hours (e.g. 7 for WIB)
 * @returns {Object} { fajr, sunrise, dhuhr, asar, maghrib, isha } — each "HH:MM"
 */
export function calcPrayerTimes(lat, lng, dateObj, timezone) {
  var jd = julianDate(dateObj.year, dateObj.month, dateObj.day);
  var sun = sunPosition(jd);
  var decl = sun.decl;
  var eot  = sun.eot;

  // Dhuhr (solar noon in local time)
  var dhuhrMins = 12 + timezone - lng / 15 - eot / 60;

  var fajrAngle    = -20;   // Kemenag RI
  var ishaAngle    = -18;   // Kemenag RI
  var sunriseAngle = -0.8333;
  var maghribAngle = -0.8333;

  var haFajr    = hourAngle(lat, decl, fajrAngle);
  var haSunrise = hourAngle(lat, decl, sunriseAngle);
  var haMaghrib = hourAngle(lat, decl, maghribAngle);
  var haIsha    = hourAngle(lat, decl, ishaAngle);
  var altAsar   = asarAngle(lat, decl);
  var haAsar    = hourAngle(lat, decl, altAsar);

  var base = dhuhrMins * 60; // seconds
  return {
    fajr:    minsToHHMM(dhuhrMins - haFajr / 15 * 60),
    sunrise: minsToHHMM(dhuhrMins - haSunrise / 15 * 60),
    dhuhr:   minsToHHMM(dhuhrMins),
    asar:    minsToHHMM(dhuhrMins + haAsar / 15 * 60),
    maghrib: minsToHHMM(dhuhrMins + haMaghrib / 15 * 60),
    isha:    minsToHHMM(dhuhrMins + haIsha / 15 * 60),
  };
}

/**
 * Returns index of the next prayer (0=Fajr, 1=Sunrise, 2=Dhuhr, 3=Asar, 4=Maghrib, 5=Isha)
 * or -1 if past Isha (next is Fajr tomorrow → treat as 0).
 */
export function nextPrayerIndex(times, nowMins) {
  var order = ["fajr", "sunrise", "dhuhr", "asar", "maghrib", "isha"];
  for (var i = 0; i < order.length; i++) {
    var t = times[order[i]];
    var h = parseInt(t.slice(0, 2));
    var m = parseInt(t.slice(3, 5));
    if (nowMins < h * 60 + m) return i;
  }
  return 0; // past Isha → Fajr tomorrow
}
