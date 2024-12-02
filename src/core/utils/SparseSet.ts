export type SparseSet = {
    add: (val: number) => void
    remove: (val: number) => void
    has: (val: number) => boolean
    sparse: number[]
    dense: number[] | Uint32Array
    reset: () => void
}

export const createSparseSet = (): SparseSet => {
	const dense: number[] = []
	const sparse: number[] = []

	const has = (val: number) => dense[sparse[val]] === val

	const add = (val: number) => {
		if (has(val)) return
		sparse[val] = dense.push(val) - 1
	}

	const remove = (val: number) => {
		if (!has(val)) return
		const index = sparse[val]
		const swapped = dense.pop()!
		if (swapped !== val) {
			dense[index] = swapped
			sparse[swapped] = index
		}
	}

	const reset = () => {
		dense.length = 0
		sparse.length = 0
	}

	return {
		add,
		remove,
		has,
		sparse,
		dense,
		reset,
	}
}

const SharedArrayBufferOrArrayBuffer = typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : ArrayBuffer

export const createUint32SparseSet = (initialCapacity: number = 1000): SparseSet => {
	const sparse: number[] = []
	let length = 0
	let dense: Uint32Array = new Uint32Array(new SharedArrayBufferOrArrayBuffer(initialCapacity * 4))

	const has = (val: number) => val < sparse.length && sparse[val] < length && dense[sparse[val]] === val

	const add = (val: number) => {
		if (has(val)) return
		if (length >= dense.length) {
			const newDense = new Uint32Array(new SharedArrayBufferOrArrayBuffer(dense.length * 2 * 4))
			newDense.set(dense)
			dense = newDense
		}
		dense[length] = val
		sparse[val] = length
		length++
	}

	const remove = (val: number) => {
		if (!has(val)) return
		length--
		const index = sparse[val]
		const swapped = dense[length]
		dense[index] = swapped
		sparse[swapped] = index
	}

	const reset = () => {
		length = 0
		sparse.length = 0
	}

	return {
		add,
		remove,
		has,
		sparse,
		get dense() {
			return new Uint32Array(dense.buffer, 0, length)
		},
		reset,
	}
}