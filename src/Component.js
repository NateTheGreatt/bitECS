import { alloc } from './DataManager.js'
import { $queryComponents, $queries, queryAddEntity, queryRemoveEntity, queryCheckEntity, queryCheckComponents } from './Query.js'
import { $bitflag, $size } from './World.js'
import { $entityMasks } from './Entity.js'

export const $componentMap = Symbol('componentMap')
export const $deferredComponentRemovals = Symbol('de$deferredComponentRemovals')

export const defineComponent = (schema) => schema.constructor.name === 'Map' ? schema : alloc(schema)

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
    manager: component
  })

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
  if (hasComponent(world, component, eid)) return

  // Add bitflag to entity bitmask
  const { generationId, bitflag } = world[$componentMap].get(component)
  world[$entityMasks][generationId][eid] |= bitflag

  // Zero out each property value
  // component._reset(eid)

  // todo: archetype graph
  const queries = world[$queries]
  queries.forEach(query => {
    const components = query[$queryComponents]
    if (!queryCheckComponents(world, query, components)) return
    const match = queryCheckEntity(world, query, eid)
    if (match) queryAddEntity(world, query, eid)
  })
}

export const removeComponent = (world, component, eid) => world[$deferredComponentRemovals].push(component, eid)

export const commitComponentRemovals = (world) => {
  const deferredComponentRemovals = world[$deferredComponentRemovals]
  for (let i = 0; i < deferredComponentRemovals.length; i += 2) {
    const component = deferredComponentRemovals[i]
    const eid = deferredComponentRemovals[i + 1]

    const { generationId, bitflag } = world[$componentMap].get(component)

    if (!(world[$entityMasks][generationId][eid] & bitflag)) return

    // Remove flag from entity bitmask
    world[$entityMasks][generationId][eid] &= ~bitflag

    // todo: archetype graph
    const queries = world[$queries]
    queries.forEach(query => {
      const components = query[$queryComponents]
      if (!queryCheckComponents(world, query, components)) return
      const match = queryCheckEntity(world, query, eid)
      if (match) queryRemoveEntity(world, query, eid)
    })
  }
  deferredComponentRemovals.length = 0
}
