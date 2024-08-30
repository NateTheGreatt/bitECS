import { QueryTerm, World, observe, onAdd, onRemove } from '../core'
import { createSparseSet } from '../core/utils/SparseSet'

export const enterQuery = (...terms: QueryTerm[]) => {
  const queue = createSparseSet()
  const initSet = new WeakSet<World>()
  return (world: World) => {
    if (!initSet.has(world)) {
      observe(world, onAdd(...terms), queue.add)
      initSet.add(world)
    }
    const results = queue.dense.slice(0)
    queue.reset()
    return results
  }
}

export const enterQueue = enterQuery

export const exitQuery = (...terms: QueryTerm[]) => {
  const queue = createSparseSet()
  const initSet = new WeakSet<World>()
  return (world: World) => {
    if (!initSet.has(world)) {
      observe(world, onRemove(...terms), queue.add)
      initSet.add(world)
    }
    const results = queue.dense.slice(0)
    queue.reset()
    return results
  }
}

export const exitQueue = exitQuery