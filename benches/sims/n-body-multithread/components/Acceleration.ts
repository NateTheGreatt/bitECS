import { CONSTANTS } from "../constants";

export const Acceleration = {
  x: new Float64Array(new SharedArrayBuffer(CONSTANTS.NBODIES * Float64Array.BYTES_PER_ELEMENT)),
  y: new Float64Array(new SharedArrayBuffer(CONSTANTS.NBODIES * Float64Array.BYTES_PER_ELEMENT)),
};
