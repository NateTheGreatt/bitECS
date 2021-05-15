import { $storeSize, createStore, resetStoreFor, resizeStore } from './Storage.js'
import { $queries, queryAddEntity, queryRemoveEntity, queryCheckEntity, queryCheckComponent } from './Query.js'
import { $bitflag, $size } from './World.js'
import { $entityMasks, defaultSize } from './Entity.js'

export const $componentMap = Symbol('componentMap')

export const components = []

export const resizeComponents = (size) => {
  components.forEach(component => resizeStore(component, size))
}

export const defineComponent = (schema) => {
  const component = createStore(schema, defaultSize)
  if (schema && Object.keys(schema).length) components.push(component)
  return component
}

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
  const registeredComponent = world[$componentMap].get(component)
  if (!registeredComponent) return
  const { generationId, bitflag } = registeredComponent
  const mask = world[$entityMasks][generationId][eid]
  return (mask & bitflag) === bitflag
}

export const addComponent = (world, component, eid, reset=false) => {
  if (!world[$componentMap].has(component)) registerComponent(world, component)
  if (hasComponent(world, component, eid)) return
  // Add bitflag to entity bitmask
  const { generationId, bitflag } = world[$componentMap].get(component)
  world[$entityMasks][generationId][eid] |= bitflag

  // todo: archetype graph
  world[$queries].forEach(query => {
    if (!queryCheckComponent(world, query, component)) return
    const match = queryCheckEntity(world, query, eid)
    if (match) queryAddEntity(world, query, eid)
  })
  
  // Zero out each property value
  if (reset) resetStoreFor(component, eid)
}

export const removeComponent = (world, component, eid, reset=true) => {
  const { generationId, bitflag } = world[$componentMap].get(component)

  if (!(world[$entityMasks][generationId][eid] & bitflag)) return

  // todo: archetype graph
  world[$queries].forEach(query => {
    if (!queryCheckComponent(world, query, component)) return
    const match = queryCheckEntity(world, query, eid)
    if (match) queryRemoveEntity(world, query, eid)
  })

  // Remove flag from entity bitmask
  world[$entityMasks][generationId][eid] &= ~bitflag
  
  // Zero out each property value
  if (reset) resetStoreFor(component, eid)
}
