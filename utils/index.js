import { openAssetsSync, statAssetsSync, readSync, closeSync, O_RDONLY } from "@zos/fs";

// Baca file JSON dari folder assets (di-encode ensure_ascii, jadi buffer-nya ASCII saja)
export function readAssetJSON(path) {
  const stat = statAssetsSync({ path });
  if (!stat) return null;

  const buffer = new ArrayBuffer(stat.size);
  const fd = openAssetsSync({ path, flag: O_RDONLY });
  readSync({ fd, buffer });
  closeSync({ fd });

  // Buffer berisi ASCII saja (\uXXXX escapes) — aman pakai fromCharCode per chunk
  const bytes = new Uint8Array(buffer);
  let str = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    str += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
  }
  return JSON.parse(str);
}

// Konversi angka Latin ke angka Arab (١٢٣...) untuk penanda ayat ﴿١﴾
export function toArabicNum(n) {
  return String(n).replace(/[0-9]/g, function(d) {
    return "٠١٢٣٤٥٦٧٨٩"[d];
  });
}

export function assets(type) {
  return function(path) { return type + "/" + path; };
}
