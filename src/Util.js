export const Uint32SparseSet = (length) => {
  const dense = []
  const sparse = new Uint32Array(length).fill(2**32-1)

  const has = val => dense[sparse[val]] === val

  const add = val => {
    if (has(val)) return
    sparse[val] = dense.push(val) - 1
  }

  const remove = val => {
    if (!has(val)) return
    const index = sparse[val]
    const swapped = dense.pop()
    if (swapped !== val) {
      dense[index] = swapped
      sparse[swapped] = index
    }
  }

  return {
    add,
    remove,
    has,
    sparse,
    dense,
  }
}

export const SparseSet = () => {
  const dense = []
  const sparse = []

  const has = val => dense[sparse[val]] === val

  const add = val => {
    if (has(val)) return
    sparse[val] = dense.push(val) - 1
  }

  const remove = val => {
    if (!has(val)) return
    const index = sparse[val]
    const swapped = dense.pop()
    if (swapped !== val) {
      dense[index] = swapped
      sparse[swapped] = index
    }
  }

  return {
    add,
    remove,
    has,
    sparse,
    dense,
  }
}