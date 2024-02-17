export const Uint32SparseSet = (length: number) => {
  const dense = new Uint32Array(length);
  const sparse = new Uint32Array(length);

  let cursor = 0;
  const count = () => cursor + 1;
  const has = (val: number) => dense[sparse[val]] === val;

  const add = (val: number) => {
    if (has(val)) return;
    sparse[val] = cursor;
    dense[cursor] = val;

    cursor++;
  };

  const remove = (val: number) => {
    if (!has(val)) return;
    const index = sparse[val];
    const swapped = dense[cursor];
    if (swapped !== val) {
      dense[index] = swapped;
      sparse[swapped] = index;
    }

    cursor--;
  };

  return {
    add,
    remove,
    has,
    sparse,
    dense,
    count,
  };
};

export const SparseSet = () => {
  const dense: number[] = [];
  const sparse: number[] = [];

  dense.sort = function (comparator) {
    const result = Array.prototype.sort.call(this, comparator);

    for (let i = 0; i < dense.length; i++) {
      sparse[dense[i]] = i;
    }

    return result;
  };

  const has = (val: number) => dense[sparse[val]] === val;

  const add = (val: number) => {
    if (has(val)) return;
    sparse[val] = dense.push(val) - 1;
  };

  const remove = (val: number) => {
    if (!has(val)) return;
    const index = sparse[val];
    const swapped = dense.pop();
    if (swapped !== val) {
      dense[index] = swapped;
      sparse[swapped] = index;
    }
  };

  const reset = () => {
    dense.length = 0;
    sparse.length = 0;
  };

  return {
    add,
    remove,
    has,
    sparse,
    dense,
    reset,
  };
};
