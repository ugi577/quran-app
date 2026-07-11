// Navigasi + manajer gesture — Quran App
//
// Mengelola router dan SATU-SATUNYA listener onGesture global (Zepp OS hanya
// mengizinkan satu). Agar swipe tetap bekerja saat banyak page bertumpuk,
// kita miripkan dengan stack navigasi: setiap page mendaftarkan handler saat
// build (enterPage) dan melepaskannya saat onDestroy (exitPage). Handler aktif
// = puncak stack (page teratas), sehingga swipe selalu ke page yang terlihat.

import { push, replace, back } from "@zos/router";
import {
  onGesture,
  offGesture,
  GESTURE_LEFT,
  GESTURE_RIGHT,
  GESTURE_UP,
  GESTURE_DOWN,
} from "@zos/interaction";
import * as R from "./routes.js";

// Stack handler: tiap elemen { left, right, up, down } (fungsi opsional)
const _stack = [];

function _dispatch(event) {
  const top = _stack[_stack.length - 1];
  if (!top) return false;
  let handled = false;
  if (event === GESTURE_LEFT && typeof top.left === "function") { top.left(); handled = true; }
  else if (event === GESTURE_RIGHT && typeof top.right === "function") { top.right(); handled = true; }
  else if (event === GESTURE_UP && typeof top.up === "function") { top.up(); handled = true; }
  else if (event === GESTURE_DOWN && typeof top.down === "function") { top.down(); handled = true; }
  return handled; // true => lewati perilaku default
}

let _registered = false;
function _ensureRegistered() {
  if (_registered) return;
  onGesture({ callback: _dispatch });
  _registered = true;
}

// Panggil di awal build() setiap page.
export function enterPage(handlers) {
  _ensureRegistered();
  _stack.push(handlers || {});
}

// Panggil di onDestroy() setiap page (pakai referensi handler yang sama).
export function exitPage(handlers) {
  const i = _stack.lastIndexOf(handlers);
  if (i !== -1) _stack.splice(i, 1);
  else if (_stack.length) _stack.pop();

  if (_stack.length === 0 && _registered) {
    offGesture();
    _registered = false;
  }
}

// Lepas semua listener (panggil dari app.onDestroy).
export function shutdown() {
  _stack.length = 0;
  if (_registered) {
    offGesture();
    _registered = false;
  }
}

export function go(pageKey, params) {
  push({ url: R[pageKey], params: params == null ? undefined : String(params) });
}

export function goReplace(pageKey, params) {
  replace({ url: R[pageKey], params: params == null ? undefined : String(params) });
}

export function goBack() {
  back();
}

export default { enterPage, exitPage, shutdown, go, goReplace, goBack, R };
