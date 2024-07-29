export const SparseSet = () => {
	const dense: number[] = [];
	const sparse: number[] = [];

	const has = (val: number) => dense[sparse[val]] === val;

	const add = (val: number) => {
		if (has(val)) return;
		sparse[val] = dense.push(val) - 1;
	};

	const remove = (val: number) => {
		if (!has(val)) return;
		const index = sparse[val];
		const swapped = dense.pop()!;
		if (swapped !== val) {
			dense[index] = swapped;
			sparse[swapped] = index;
		}
	};

	const reset = () => {
		dense.length = 0;
		sparse.length = 0;
	};

	const sort = () => {
		dense.sort((a, b) => a - b);

		for (let i = 0; i < dense.length; i++) {
			sparse[dense[i]] = i;
		}
	};

	return {
		add,
		remove,
		has,
		sparse,
		dense,
		reset,
		sort,
	};
};
