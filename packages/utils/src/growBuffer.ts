// @ts-nocheck
export const growBuffer = (buffer: ArrayBuffer | SharedArrayBuffer, newCapacity: number) => {
	if (buffer.grow) {
		buffer.grow(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
	} else if (buffer.resize) {
		buffer.resize(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
	}
};
