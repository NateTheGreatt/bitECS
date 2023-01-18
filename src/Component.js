import { $storeSize, createStore, resetStoreFor, resizeStore } from './Storage.js'
import { $queries, queryAddEntity, queryRemoveEntity, queryCheckEntity, commitRemovals } from './Query.js'
import { $bitflag, $size } from './World.js'
import { $entityMasks, getDefaultSize, eidToWorld, $entityComponents, getGlobalSize, $entitySparseSet } from './Entity.js'

export const $componentMap = Symbol('componentMap')

export const components = []

export const resizeComponents = (size) => {
  components.forEach(component => resizeStore(component, size))
}


/**
 * Defines a new component store.
 *
 * @param {object} schema
 * @returns {object}
 */
export const defineComponent = (schema, size) => {
  const component = createStore(schema, size || getGlobalSize())
  if (schema && Object.keys(schema).length) components.push(component)
  return component
}

export const incrementBitflag = (world) => {
  world[$bitflag] *= 2
  if (world[$bitflag] >= 2**31) {
    world[$bitflag] = 1
    world[$entityMasks].push(new Uint32Array(world[$size]))
  }
}


/**
 * Registers a component with a world.
 *
 * @param {World} world
 * @param {Component} component
 */
export const registerComponent = (world, component) => {
  if (!component) throw new Error(`bitECS - Cannot register null or undefined component`)

  const queries = new Set()
  const notQueries = new Set()
  const changedQueries = new Set()

  world[$queries].forEach(q => {
    if (q.allComponents.includes(component)) {
      queries.add(q)
    }
  })

  world[$componentMap].set(component, { 
    generationId: world[$entityMasks].length - 1,
    bitflag: world[$bitflag],
    store: component,
    queries,
    notQueries,
    changedQueries,
  })

  incrementBitflag(world)
}

/**
 * Registers multiple components with a world.
 *
 * @param {World} world
 * @param {Component} components
 */
export const registerComponents = (world, components) => {
  components.forEach(c => registerComponent(world, c))
}

/**
 * Checks if an entity has a component.
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 * @returns {boolean}
 */
export const hasComponent = (world, component, eid) => {
  const registeredComponent = world[$componentMap].get(component)
  if (!registeredComponent) return false
  const { generationId, bitflag } = registeredComponent
  const mask = world[$entityMasks][generationId][eid]
  return (mask & bitflag) === bitflag
}

/**
 * Adds a component to an entity
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 * @param {boolean} [reset=false]
 */
export const addComponent = (world, component, eid, reset=false) => {
  if (eid === undefined) throw new Error('bitECS - entity is undefined.')
  if (!world[$entitySparseSet].has(eid)) throw new Error('bitECS - entity does not exist in the world.')
  if (!world[$componentMap].has(component)) registerComponent(world, component)
  if (hasComponent(world, component, eid)) return

  const c = world[$componentMap].get(component)
  const { generationId, bitflag, queries, notQueries } = c
    
  // Add bitflag to entity bitmask
  world[$entityMasks][generationId][eid] |= bitflag

  // todo: archetype graph
  queries.forEach(q => {
    // remove this entity from toRemove if it exists in this query
    q.toRemove.remove(eid)
    const match = queryCheckEntity(world, q, eid)
    if (match) {
      q.exited.remove(eid)
      queryAddEntity(q, eid)
    }
    if (!match) {
      q.entered.remove(eid)
      queryRemoveEntity(world, q, eid)
    }
  })

  world[$entityComponents].get(eid).add(component)

  // Zero out each property value
  if (reset) resetStoreFor(component, eid)
}

/**
 * Removes a component from an entity and resets component state unless otherwise specified.
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 * @param {boolean} [reset=true]
 */
export const removeComponent = (world, component, eid, reset=true) => {
  if (eid === undefined) throw new Error('bitECS - entity is undefined.')
  if (!world[$entitySparseSet].has(eid)) throw new Error('bitECS - entity does not exist in the world.')
  if (!hasComponent(world, component, eid)) return

  const c = world[$componentMap].get(component)
  const { generationId, bitflag, queries } = c

  // Remove flag from entity bitmask
  world[$entityMasks][generationId][eid] &= ~bitflag
  
  // todo: archetype graph
  queries.forEach(q => {
    // remove this entity from toRemove if it exists in this query
    q.toRemove.remove(eid)
    const match = queryCheckEntity(world, q, eid)
    if (match) {
      q.exited.remove(eid)
      queryAddEntity(q, eid)
    }
    if (!match) {
      q.entered.remove(eid)
      queryRemoveEntity(world, q, eid)
    }
  })

  world[$entityComponents].get(eid).delete(component)

  // Zero out each property value
  if (reset) resetStoreFor(component, eid)
}
