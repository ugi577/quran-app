import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

export const PAD = px(50);
export const W = DEVICE_WIDTH - PAD * 2;

// Tinggi baris teks Arab per baris (font 26 + spasi)
export const LINE_H = px(36);

// Gap antara metadata "Hal. X · Juz Y" dan ayat berikutnya
export const META_H = px(28);
export const GAP = px(18);
