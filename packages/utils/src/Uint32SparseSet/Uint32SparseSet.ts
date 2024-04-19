import { isSabSupported } from '../isSabSupported';
import { $buffer, $dense, $length } from './symbols';

export interface IUint32SparseSet {
	sparse: number[];
	dense: Uint32Array;
	[$dense]: Uint32Array;
	[$length]: number;
	[$buffer]: SharedArrayBuffer | ArrayBuffer;
}

// Length is stored at buffer index 0.

export function createUint32SparseSet(
	initialCapacity: number,
	maxCapacity: number = initialCapacity
): IUint32SparseSet {
	const buffer = isSabSupported()
		? // @ts-expect-error - TS Doesn't know buffers can grow
		  new SharedArrayBuffer((initialCapacity + 1) * Uint32Array.BYTES_PER_ELEMENT, {
				maxByteLength: (maxCapacity + 1) * Uint32Array.BYTES_PER_ELEMENT,
		  })
		: // @ts-expect-error - TS Doesn't know buffers can grow
		  new ArrayBuffer((initialCapacity + 1) * Uint32Array.BYTES_PER_ELEMENT, {
				maxByteLength: (maxCapacity + 1) * Uint32Array.BYTES_PER_ELEMENT,
		  });

	// Offset by 1 element to allow for a sentinel value.
	const dense = new Uint32Array(buffer, Uint32Array.BYTES_PER_ELEMENT, initialCapacity);
	const sparse = new Array(initialCapacity);
	const length = new Uint32Array(buffer, 0, 1);

	return {
		[$dense]: dense,
		[$buffer]: buffer,
		get [$length]() {
			return length[0];
		},
		set [$length](value) {
			length[0] = value;
		},
		sparse,
		get dense() {
			return sparseSetGetDense(this);
		},
	};
}

export function sparseSetAdd(sparseSet: IUint32SparseSet, value: number): void {
	if (sparseSet[$length] + 1 > sparseSet[$dense].length) {
		sparseSetGrow(sparseSet, Math.max(value, sparseSet[$length] * 2));
	}

	const denseIndex = sparseSet[$length];

	if (sparseSet.sparse[value] === undefined) {
		sparseSet[$dense][denseIndex] = value;
		sparseSet.sparse[value] = denseIndex;
		sparseSet[$length]++;
	}
}

export function sparseSetHas(sparseSet: IUint32SparseSet, value: number): boolean {
	return (
		sparseSet.sparse[value] < sparseSet[$length] &&
		sparseSet[$dense][sparseSet.sparse[value]] === value
	);
}

export function sparseSetRemove(sparseSet: IUint32SparseSet, value: number): void {
	if (sparseSetHas(sparseSet, value)) {
		const denseIndex = sparseSet.sparse[value];
		sparseSet[$dense][denseIndex] = sparseSet[$dense][sparseSet[$length] - 1];
		sparseSet.sparse[sparseSet[$dense][denseIndex]] = denseIndex;
		delete sparseSet.sparse[value];
		sparseSet[$length]--;
	}
}

export function sparseSetGrow(sparseSet: IUint32SparseSet, newCapacity: number): void {
	// @ts-expect-error - TS Doesn't know SAB can grow
	sparseSet[$buffer].grow(newCapacity * Uint32Array.BYTES_PER_ELEMENT);
	sparseSet[$dense] = new Uint32Array(sparseSet[$buffer]);
}

export function sparseSetGetLength(sparseSet: IUint32SparseSet): number {
	return sparseSet[$length];
}

export function sparseSetGetDense(sparseSet: IUint32SparseSet): Uint32Array {
	// Offset by 1 element to allow for a sentinel value.
	return new Uint32Array(sparseSet[$buffer], Uint32Array.BYTES_PER_ELEMENT, sparseSet[$length]);
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
