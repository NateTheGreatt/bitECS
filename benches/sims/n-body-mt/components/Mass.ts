import { CONSTANTS } from "../constants";

export const Mass = {
  value: new Float64Array(new SharedArrayBuffer(CONSTANTS.NBODIES * Float64Array.BYTES_PER_ELEMENT))
}