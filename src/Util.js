export const Uint32SparseSet = (length) => {
  const dense = new Uint32Array(length)
  const sparse = new Uint32Array(length)

  let cursor = 0
  dense.count = () => cursor + 1

  const has = val => dense[sparse[val]] === val

  const add = val => {
    if (has(val)) return
    sparse[val] = cursor
    dense[cursor] = val

    cursor++
  }

  const remove = val => {
    if (!has(val)) return
    const index = sparse[val]
    const swapped = dense[cursor]
    if (swapped !== val) {
      dense[index] = swapped
      sparse[swapped] = index
    }

    cursor--
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

  dense.sort = function (comparator) {
    const result = Array.prototype.sort.call(this, comparator)

    for(let i = 0; i < dense.length; i++) {
      sparse[dense[i]] = i
    }
    
    return result
  }

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