import { CONSTANTS } from "../constants";

export const Circle = {
  radius: new Float64Array(new SharedArrayBuffer(CONSTANTS.NBODIES * Float64Array.BYTES_PER_ELEMENT))
}