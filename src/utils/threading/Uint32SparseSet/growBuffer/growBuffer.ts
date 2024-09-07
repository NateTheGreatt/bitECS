export const growBuffer = (
	buffer: ArrayBuffer | SharedArrayBuffer,
	newCapacity: number
): ArrayBuffer | SharedArrayBuffer => {
	if (buffer instanceof ArrayBuffer) {
		try {
			(buffer as any).resize(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
			return buffer;
		} catch (error) {
			// Fallback to creating a new buffer if resize fails
			const newBuffer = new ArrayBuffer(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
			new Uint32Array(newBuffer).set(new Uint32Array(buffer));
			return newBuffer;
		}
	} else {
		try {
			(buffer as any).grow(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
			return buffer;
		} catch (error) {
			// Fallback to creating a new buffer if grow fails
			const newBuffer = new SharedArrayBuffer(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
			new Uint32Array(newBuffer).set(new Uint32Array(buffer));
			return newBuffer;
		}
	}
};
