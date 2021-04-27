import { $storeSize, createStore, resetStoreFor, resizeStore } from './Storage.js'
import { $queryComponents, $queries, queryAddEntity, queryRemoveEntity, queryCheckEntity, queryCheckComponents } from './Query.js'
import { $bitflag, $size } from './World.js'
import { $entityMasks } from './Entity.js'

export const $componentMap = Symbol('componentMap')
export const $deferredComponentRemovals = Symbol('$deferredComponentRemovals')

export const defineComponent = (schema) => createStore(schema)

export const incrementBitflag = (world) => {
  world[$bitflag] *= 2
  if (world[$bitflag] >= 2**32) {
    world[$bitflag] = 1
    world[$entityMasks].push(new Uint32Array(world[$size]))
  }
}

export const registerComponent = (world, component) => {
  world[$componentMap].set(component, { 
    generationId: world[$entityMasks].length - 1,
    bitflag: world[$bitflag],
    store: component
  })

  if (component[$storeSize] < world[$size]) {
    resizeStore(component, world[$size])
  }

  incrementBitflag(world)
}

export const registerComponents = (world, components) => {
  components.forEach(c => registerComponent(world, c))
}

export const hasComponent = (world, component, eid) => {
  const { generationId, bitflag } = world[$componentMap].get(component)
  const mask = world[$entityMasks][generationId][eid]
  return (mask & bitflag) === bitflag
}

export const addComponent = (world, component, eid) => {
  if (!world[$componentMap].has(component)) registerComponent(world, component)
  if (hasComponent(world, component, eid)) return

  // Add bitflag to entity bitmask
  const { generationId, bitflag } = world[$componentMap].get(component)
  world[$entityMasks][generationId][eid] |= bitflag

  // Zero out each property value
  resetStoreFor(component, eid)

  // todo: archetype graph
  const queries = world[$queries]
  queries.forEach(query => {
    const components = query[$queryComponents]
    if (!queryCheckComponents(world, query, components)) return
    const match = queryCheckEntity(world, query, eid)
    if (match) queryAddEntity(world, query, eid)
  })
}

export const removeComponent = (world, component, eid) => {
  const { generationId, bitflag } = world[$componentMap].get(component)

  if (!(world[$entityMasks][generationId][eid] & bitflag)) return

  // todo: archetype graph
  const queries = world[$queries]
  queries.forEach(query => {
    const components = query[$queryComponents]
    if (!queryCheckComponents(world, query, components)) return
    const match = queryCheckEntity(world, query, eid)
    if (match) queryRemoveEntity(world, query, eid)
  })

  // Remove flag from entity bitmask
  world[$entityMasks][generationId][eid] &= ~bitflag
}
