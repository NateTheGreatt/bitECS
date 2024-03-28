import { CONSTANTS } from "../constants";

export const Color = {
  r: new Uint8Array(new SharedArrayBuffer(CONSTANTS.NBODIES * Uint8Array.BYTES_PER_ELEMENT)),
  g: new Uint8Array(new SharedArrayBuffer(CONSTANTS.NBODIES * Uint8Array.BYTES_PER_ELEMENT)),
  b: new Uint8Array(new SharedArrayBuffer(CONSTANTS.NBODIES * Uint8Array.BYTES_PER_ELEMENT)),
  a: new Uint8Array(new SharedArrayBuffer(CONSTANTS.NBODIES * Uint8Array.BYTES_PER_ELEMENT)),
}