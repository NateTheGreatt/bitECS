import { isSabSupported } from './isSabSupported';

const $dense = Symbol('dense');
const $length = Symbol('length');
const $buffer = Symbol('buffer');

export interface Uint32SparseSet {
	sparse: number[];
	dense: Uint32Array;
	[$dense]: Uint32Array;
	[$length]: number;
	[$buffer]: SharedArrayBuffer | ArrayBuffer;
}

export function createUint32SparseSet(
	initialCapacity: number,
	maxCapacity: number = initialCapacity
): Uint32SparseSet {
	const buffer = isSabSupported()
		? // @ts-expect-error - TS Doesn't know buffers can grow
		  new SharedArrayBuffer(initialCapacity * Uint32Array.BYTES_PER_ELEMENT, {
				maxByteLength: maxCapacity * Uint32Array.BYTES_PER_ELEMENT,
		  })
		: // @ts-expect-error - TS Doesn't know buffers can grow
		  new ArrayBuffer(initialCapacity * Uint32Array.BYTES_PER_ELEMENT, {
				maxByteLength: maxCapacity * Uint32Array.BYTES_PER_ELEMENT,
		  });

	const dense = new Uint32Array(buffer);
	const sparse = new Array(initialCapacity);
	const length = 0;

	return {
		[$dense]: dense,
		[$length]: length,
		[$buffer]: buffer,
		sparse,
		get dense() {
			return new Uint32Array(this[$buffer], 0, this[$length]);
		},
	};
}

export function sparseSetAdd(sparseSet: Uint32SparseSet, value: number): void {
	if (sparseSet[$length] + 1 > sparseSet[$dense].length) {
		sparseSetGrow(sparseSet, Math.max(value, sparseSet[$length] * 2));
	}
	if (sparseSet.sparse[value] === undefined) {
		sparseSet[$dense][sparseSet[$length]] = value;
		sparseSet.sparse[value] = sparseSet[$length];
		sparseSet[$length]++;
	}
}

export function sparseSetHas(sparseSet: Uint32SparseSet, value: number): boolean {
	return (
		sparseSet.sparse[value] < sparseSet[$length] &&
		sparseSet[$dense][sparseSet.sparse[value]] === value
	);
}

export function sparseSetRemove(sparseSet: Uint32SparseSet, value: number): void {
	if (sparseSetHas(sparseSet, value)) {
		const denseIndex = sparseSet.sparse[value];
		sparseSet[$dense][denseIndex] = sparseSet[$dense][sparseSet[$length] - 1];
		sparseSet.sparse[sparseSet[$dense][denseIndex]] = denseIndex;
		delete sparseSet.sparse[value];
		sparseSet[$length]--;
	}
}

export function sparseSetGrow(sparseSet: Uint32SparseSet, newCapacity: number): void {
	// @ts-expect-error - TS Doesn't know SAB can grow
	sparseSet[$buffer].grow(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
	sparseSet[$dense] = new Uint32Array(sparseSet[$buffer]);
}

export function sparseSetGetLength(sparseSet: Uint32SparseSet): number {
	return sparseSet[$length];
}

export function sparseSetGetDense(sparseSet: Uint32SparseSet): Uint32Array {
	return new Uint32Array(sparseSet[$buffer], 0, sparseSet[$length]);
}

export default {
	create: createUint32SparseSet,
	add: sparseSetAdd,
	remove: sparseSetRemove,
	has: sparseSetHas,
	grow: sparseSetGrow,
	length: sparseSetGetLength,
	dense: sparseSetGetDense,
};
