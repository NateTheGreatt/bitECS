import { isGrowResizeSupported } from '../is-supported/isGrowResizeSupported';

export const growBuffer = (
	buffer: ArrayBuffer | SharedArrayBuffer,
	newCapacity: number,
	shouldReplaceBuffer = false
): ArrayBuffer | SharedArrayBuffer => {
	if (buffer instanceof ArrayBuffer) {
		if (isGrowResizeSupported() && !shouldReplaceBuffer) {
			// @ts-expect-error
			buffer.resize(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
			return buffer;
		} else {
			const newBuffer = new ArrayBuffer(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
			new Uint32Array(newBuffer).set(new Uint32Array(buffer));
			return newBuffer;
		}
	} else {
		if (isGrowResizeSupported() && !shouldReplaceBuffer) {
			// @ts-expect-error
			buffer.grow(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
			return buffer;
		} else {
			const newBuffer = new SharedArrayBuffer(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
			new Uint32Array(newBuffer).set(new Uint32Array(buffer));
			return newBuffer;
		}
	}
};
