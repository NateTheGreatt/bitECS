import { Constructor, TypedArray } from "./types";

export const resize = (typedArray: TypedArray, size: number) => {
  const newBuffer = new ArrayBuffer(size * typedArray.BYTES_PER_ELEMENT);
  const newTa = new (typedArray.constructor as Constructor)(newBuffer);
  newTa.set(typedArray, 0);
  return newTa;
};
