import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// Padding layar bulat — lebih besar agar tidak terpotong tepi lingkaran
export const PAD = px(50);
export const W = DEVICE_WIDTH - PAD * 2;

// Tinggi setiap item di daftar surah
export const ITEM_H = px(96);

// Tinggi header "Al-Qur'an Al-Karim" di bagian atas
export const HEADER_H = px(70);
