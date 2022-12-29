
export type SparseSet<T extends number> = {
  dense: T[]
  sparse: number[]
  add: (val:T) => number
  delete: (val:T) => number
  has: (val:T) => boolean
}

export const createSparseSet = <T extends number>(): SparseSet<T> => {
  const dense: T[] = []
  const sparse: number[] = []

  dense.sort = function (comparator) {
    const result = Array.prototype.sort.call(this, comparator)

    for(let i = 0; i < dense.length; i++) {
      sparse[dense[i]] = i
    }
    
    return result
  }

  const has = (val:T) => dense[sparse[val]] === val

  const add = (val:T) => {
    if (has(val)) return
    sparse[val] = dense.push(val) - 1
    return dense.length
  }

  const remove = (val:T) => {
    if (!has(val)) return
    const index = sparse[val]
    const swapped = dense.pop()
    if (swapped !== val) {
      dense[index] = swapped
      sparse[swapped] = index
    }
    return dense.length
  }

  return {
    dense,
    sparse,
    add,
    delete: remove,
    has,
  }
}