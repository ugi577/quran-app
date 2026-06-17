import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// Padding layar kotak — lebih kecil karena tidak ada sudut melengkung
export const PAD = px(30);
export const W = DEVICE_WIDTH - PAD * 2;

export const ITEM_H = px(96);
export const HEADER_H = px(70);
