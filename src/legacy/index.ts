import { QueryTerm, World, observe, onAdd, onRemove, query } from '../core'

export const defineQuery = (...terms: QueryTerm[]) => (world: World) => query(world, terms)

export const enterQuery = (...terms: QueryTerm[]) => {
  let queue: number[] = []
  const initSet = new WeakSet<World>()
  return (world: World) => {
    if (!initSet.has(world)) {
      observe(world, onAdd(...terms), (eid: number) => queue.push(eid))
      initSet.add(world)
    }
    const results = queue
    queue = []
    return results
  }
}

export const enterQueue = enterQuery

export const exitQuery = (...terms: QueryTerm[]) => {
  let queue: number[] = []
  const initSet = new WeakSet<World>()
  return (world: World) => {
    if (!initSet.has(world)) {
      observe(world, onRemove(...terms), (eid: number) => queue.push(eid))
      initSet.add(world)
    }
    const results = queue
    queue = []
    return results
  }
}

export const exitQueue = exitQuery