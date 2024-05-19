import { test, describe } from 'vitest';
import assert from 'assert';
import { growBuffer } from './growBuffer';

describe('growBuffer', () => {
	test('grow with replace strategy', () => {
		const initialCapacity = 10;
		const newCapacity = 20;
		// @ts-expect-error
		const buffer = new SharedArrayBuffer(initialCapacity * Uint32Array.BYTES_PER_ELEMENT, {
			maxByteLength: 100 * Uint32Array.BYTES_PER_ELEMENT,
		});
		const newBuffer = growBuffer(buffer, newCapacity, true);

		assert.notStrictEqual(buffer, newBuffer);
		assert.strictEqual(newBuffer.byteLength, newCapacity * Uint32Array.BYTES_PER_ELEMENT);
	});
});
