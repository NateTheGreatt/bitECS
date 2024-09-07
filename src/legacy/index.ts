import { ComponentRef, QueryTerm, World, observe, onAdd, onRemove, query, addComponent as ecsAddComponent, EntityId } from '../core'

export const defineQuery = (...terms: QueryTerm[]) => (world: World) => query(world, terms)

export const enterQuery = (...terms: QueryTerm[]) => {
  let queue: number[] = []
  const initSet = new WeakSet<World>()
  return (world: World) => {
    if (!initSet.has(world)) {
      observe(world, onAdd(...terms), (eid: EntityId) => queue.push(eid))
      initSet.add(world)
    }
    const results = queue
    queue = []
    return results
  }
}

export const exitQuery = (...terms: QueryTerm[]) => {
  let queue: number[] = []
  const initSet = new WeakSet<World>()
  return (world: World) => {
    if (!initSet.has(world)) {
      observe(world, onRemove(...terms), (eid: EntityId) => queue.push(eid))
      initSet.add(world)
    }
    const results = queue
    queue = []
    return results
  }
}

export const addComponent = (world: World, component: ComponentRef, eid: EntityId) =>
  ecsAddComponent(world, eid, component)