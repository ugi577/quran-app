import { localStorage } from "@zos/storage";
import { Geolocation } from "@zos/sensor";

var CACHE_KEY_LAT  = "pt_lat";
var CACHE_KEY_LNG  = "pt_lng";
var CACHE_KEY_NAME = "pt_city";
var CACHE_KEY_TS   = "pt_ts";
var GPS_TIMEOUT_MS = 30000;

function loadCache() {
  try {
    var lat  = parseFloat(localStorage.getItem(CACHE_KEY_LAT)  || "");
    var lng  = parseFloat(localStorage.getItem(CACHE_KEY_LNG)  || "");
    var name = localStorage.getItem(CACHE_KEY_NAME) || "";
    if (!isNaN(lat) && !isNaN(lng)) return { lat: lat, lng: lng, name: name, source: "cache" };
  } catch (e) {}
  return null;
}

function saveCache(lat, lng, name) {
  try {
    localStorage.setItem(CACHE_KEY_LAT,  String(lat));
    localStorage.setItem(CACHE_KEY_LNG,  String(lng));
    localStorage.setItem(CACHE_KEY_NAME, name || "");
    localStorage.setItem(CACHE_KEY_TS,   String(Date.now()));
  } catch (e) {}
}

/**
 * Get coordinates, with layered fallback:
 *   1. GPS (30s timeout)  → source: "GPS"
 *   2. Cache              → source: "cache"
 *   3. TODO: BLE/HP sync
 *   4. TODO: manual city input
 *
 * @param {function} onSuccess  ({ lat, lng, name, source }) => void
 * @param {function} onError    (message) => void
 */
export function getLocation(onSuccess, onError) {
  var done = false;
  var geo  = null;

  var timer = setTimeout(function() {
    if (done) return;
    done = true;
    try { if (geo) geo.stop(); } catch (e) {}
    var cached = loadCache();
    if (cached) {
      onSuccess(cached);
    } else {
      // TODO: BLE / companion-phone sync (future)
      // TODO: manual city picker (future)
      onError("Lokasi tidak ditemukan. Aktifkan GPS.");
    }
  }, GPS_TIMEOUT_MS);

  try {
    geo = new Geolocation();
    geo.start();
    geo.onChange = function() {
      if (done) return;
      var info = geo.getStatus();
      if (info === "A") { // A = data valid
        var lat = geo.getLatitude();
        var lng = geo.getLongitude();
        if (lat !== undefined && lng !== undefined) {
          done = true;
          clearTimeout(timer);
          try { geo.stop(); } catch (e) {}
          var name = "GPS";
          saveCache(lat, lng, name);
          onSuccess({ lat: lat, lng: lng, name: name, source: "GPS" });
        }
      }
    };
  } catch (e) {
    clearTimeout(timer);
    var cached = loadCache();
    if (cached) {
      onSuccess(cached);
    } else {
      onError("GPS tidak tersedia.");
    }
  }
}
