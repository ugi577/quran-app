// Ekspor teks halaman Al-Quran ke berkas di storage aplikasi.
// Zepp OS tidak punya berbagi sosial; ekspor = simpan .txt yg bisa
// ditransfer lewat Zepp App ke ponsel.
import { openSync, writeSync, closeSync, O_WRONLY, O_CREAT, O_TRUNC } from "@zos/fs";

function encode(text) {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text);
  // Fallback ASCII-mentah (Arab hilang, tapi tidak crash)
  const arr = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) arr[i] = text.charCodeAt(i) & 0xff;
  return arr;
}

// entries: array ayat { n, t, ar?, s? }
export function exportPageToFile(page, entries) {
  try {
    const lines = ["Quran App — Halaman " + page, ""];
    let curSurah = -1;
    for (const a of entries) {
      if (a.ar && a.n === 1 && a.s !== curSurah) {
        curSurah = a.s;
        lines.push(a.ar);
        lines.push("");
      }
      lines.push("(" + a.n + ") " + a.t);
    }
    const bytes = encode(lines.join("\n"));
    const fd = openSync({ path: "quran_p" + page + ".txt", flag: O_WRONLY | O_CREAT | O_TRUNC });
    writeSync({ fd, buffer: bytes.buffer ? bytes.buffer : new Uint8Array(bytes).buffer });
    closeSync(fd);
    return true;
  } catch (e) {
    return false;
  }
}
