/**
 * Used to grow buffers in environments without buffer grow/resize support
 */
export const growBufferPolyfill = (
	buffer: ArrayBuffer | SharedArrayBuffer,
	newCapacity: number
): ArrayBuffer | SharedArrayBuffer => {
	if (buffer instanceof SharedArrayBuffer) {
		const newBuffer = new SharedArrayBuffer(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
		new Uint32Array(newBuffer).set(new Uint32Array(buffer));
		return newBuffer;
	} else {
		const newBuffer = new ArrayBuffer(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
		new Uint32Array(newBuffer).set(new Uint32Array(buffer));
		return newBuffer;
	}
};

export const growBuffer = (buffer: ArrayBuffer | SharedArrayBuffer, newCapacity: number) => {
	if (buffer instanceof SharedArrayBuffer) {
		// @ts-expect-error
		buffer.grow(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
	} else if (buffer instanceof ArrayBuffer) {
		// @ts-expect-error
		buffer.resize(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
	}
};
