import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
export const { width: DEVICE_WIDTH } = getDeviceInfo();
export const PAD = px(50);
export const W = DEVICE_WIDTH - PAD * 2;
