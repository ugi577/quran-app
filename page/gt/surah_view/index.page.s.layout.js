import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

export const PAD = px(30);
export const W = DEVICE_WIDTH - PAD * 2;

export const LINE_H = px(36);
export const META_H = px(28);
export const GAP = px(18);
