import { $storeSize, createStore, resetStoreFor, resizeStore } from './Storage.js'
import { $queries, queryAddEntity, queryRemoveEntity, queryCheckEntity } from './Query.js'
import { $bitflag, $size } from './World.js'
import { $entityMasks, getDefaultSize, eidToWorld, $entityComponents } from './Entity.js'

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
export const defineComponent = (schema) => {
  const component = createStore(schema, getDefaultSize())
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
    if (q.notComponents.includes(component)) {
      queries.add(q)
    } else if (q.changedComponents.includes(component)) {
      changedQueries.add(q)
    } else if (q.components.includes(component)) {
      notQueries.add(q)
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

  if (component[$storeSize] < world[$size]) {
    resizeStore(component, world[$size])
  }

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
  if (!registeredComponent) return
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
  if (!Number.isInteger(eid)) {
    component = world
    world = eidToWorld.get(eid)
    reset = eid || reset
  }
  if (!world[$componentMap].has(component)) registerComponent(world, component)
  if (hasComponent(world, component, eid)) return

  const c = world[$componentMap].get(component)
  const { generationId, bitflag, queries, notQueries } = c
  
  notQueries.forEach(q => {
    const match = queryCheckEntity(world, q, eid)
    if (match) queryRemoveEntity(world, q, eid)
  })
  
  // Add bitflag to entity bitmask
  world[$entityMasks][generationId][eid] |= bitflag

  // todo: archetype graph
  queries.forEach(q => {
    const match = queryCheckEntity(world, q, eid)
    if (match) queryAddEntity(q, eid)
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
  if (!Number.isInteger(eid)) {
    component = world
    world = eidToWorld.get(eid)
    reset = eid || reset
  }
  const c = world[$componentMap].get(component)
  const { generationId, bitflag, queries, notQueries } = c

  if (!(world[$entityMasks][generationId][eid] & bitflag)) return

  // todo: archetype graph
  queries.forEach(q => {
    const match = queryCheckEntity(world, q, eid)
    if (match) queryRemoveEntity(world, q, eid)
  })

  // Remove flag from entity bitmask
  world[$entityMasks][generationId][eid] &= ~bitflag
  
  notQueries.forEach(q => {
    const match = queryCheckEntity(world, q, eid)
    if (match) queryAddEntity(q, eid)
  })
  
  world[$entityComponents].get(eid).delete(component)

  // Zero out each property value
  if (reset) resetStoreFor(component, eid)
}
