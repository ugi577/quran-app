// Perhitungan waktu sholat (algoritma astronomi standar).
// Metode Kemenag: sudut Fajr 20°, Isha 18°, Asar faktor 1 (Syafi'i/dll).
export const PRESETS = [
  { name: "Jakarta",   lat: -6.2000,  lng: 106.8456, tz: 7 },
  { name: "Mekkah",    lat: 21.4225, lng: 39.8262,  tz: 3 },
  { name: "Surabaya",  lat: -7.2575, lng: 112.7521, tz: 7 },
  { name: "Medan",     lat: 3.5952,  lng: 98.6722,  tz: 7 },
  { name: "Yogyakarta",lat: -7.7971, lng: 110.3701, tz: 7 },
  { name: "London",    lat: 51.5074, lng: -0.1278,  tz: 0 },
];

const FAJR_ANGLE = 20;
const ISHA_ANGLE = 18;
const SHADOW_FACTOR = 1;

function sin(d) { return Math.sin((d * Math.PI) / 180); }
function cos(d) { return Math.cos((d * Math.PI) / 180); }
function tan(d) { return Math.tan((d * Math.PI) / 180); }
function acos(d) { return (Math.acos(Math.max(-1, Math.min(1, d))) * 180) / Math.PI; }
function fix(a) { a %= 360; if (a < 0) a += 360; return a; }

function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function sunPosition(jd) {
  const D = jd - 2451545.0;
  const g = ((357.529 + 0.98560028 * D) % 360 + 360) % 360;
  const q = ((280.459 + 0.98564736 * D) % 360 + 360) % 360;
  const L = ((q + 1.915 * Math.sin(g * Math.PI / 180) + 0.02 * Math.sin(2 * g * Math.PI / 180)) % 360 + 360) % 360;
  const e = 23.439 - 0.00000036 * D;
  const Lr = (L * Math.PI) / 180;
  const er = (e * Math.PI) / 180;
  const RA = ((Math.atan2(Math.cos(er) * Math.sin(Lr), Math.cos(Lr)) * 180) / Math.PI % 360 + 360) % 360;
  const decl = (Math.asin(Math.sin(er) * Math.sin(Lr)) * 180) / Math.PI;
  const eqt = q / 15 - RA / 15;
  return { decl: decl, eqt: eqt };
}

// Mengembalikan waktu sholat dalam pecahan jam (0..24).
export function computeTimes(date, lat, lng, tz) {
  const jd = julian(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const sp = sunPosition(jd);
  const decl = sp.decl;
  const eqt = sp.eqt;
  const dhuhr = 12 + tz - lng / 15 - eqt;

  function hoursAtAltitude(a) {
    const v = (sin(a) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
    return acos(v) / 15;
  }

  const asrAlt = (Math.atan(1 / (Math.abs(tan(lat - decl)) + SHADOW_FACTOR)) * 180) / Math.PI;

  return {
    fajr:    dhuhr - hoursAtAltitude(-FAJR_ANGLE),
    sunrise: dhuhr - hoursAtAltitude(-0.833),
    dhuhr:   dhuhr,
    asr:     dhuhr + hoursAtAltitude(asrAlt),
    maghrib: dhuhr + hoursAtAltitude(-0.833),
    isha:    dhuhr + hoursAtAltitude(-ISHA_ANGLE),
  };
}

// Pecahan jam -> { h, m, min }
export function toHM(frac) {
  let h = Math.floor(frac);
  let m = Math.round((frac - h) * 60);
  if (m === 60) { h += 1; m = 0; }
  h = ((h % 24) + 24) % 24;
  return { h: h, m: m, min: h * 60 + m };
}

const KAABA = { lat: 21.4225, lng: 39.8262 };

function toRad(d) { return (d * Math.PI) / 180; }

// Sudut arah Kiblat (azimuth, 0=Utara, searah jarum jam) dari suatu titik.
export function qiblaBearing(lat, lng) {
  const phi1 = toRad(lat), phi2 = toRad(KAABA.lat);
  const dLambda = toRad(KAABA.lng - lng);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

export function distanceKm(lat, lng) {
  const R = 6371;
  const dPhi = toRad(KAABA.lat - lat);
  const dLambda = toRad(KAABA.lng - lng);
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(KAABA.lat)) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function cardinal(deg) {
  const DIRS = ["Utara", "Timur Laut", "Timur", "Tenggara", "Selatan", "Barat Daya", "Barat", "Barat Laut"];
  return DIRS[Math.round(deg / 45) % 8];
}

// Lokasi aktif: koordinat manual (jika diaktifkan) atau preset kota.
export function getLocation(s) {
  if (s && s.useManual && s.manual) {
    return {
      name: s.manual.name || "Manual",
      lat: s.manual.lat, lng: s.manual.lng, tz: s.manual.tz,
    };
  }
  let idx = s && typeof s.locationIdx === "number" ? s.locationIdx : 0;
  if (idx < 0 || idx >= PRESETS.length) idx = 0;
  return PRESETS[idx];
}
