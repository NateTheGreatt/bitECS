import { resizeComponents } from './Component.js'
import { $notQueries, $queries, queryAddEntity, queryCheckEntity, queryRemoveEntity } from './Query.js'
import { resizeWorlds } from './World.js'
import { setSerializationResized } from './Serialize.js'

export const $entityMasks = Symbol('entityMasks')
export const $entityComponents = Symbol('entityMasks')
export const $entitySparseSet = Symbol('entitySparseSet')
export const $entityArray = Symbol('entityArray')
export const $entityIndices = Symbol('entityIndices')
export const $removedEntities = Symbol('removedEntities')

let defaultSize = 100000

// need a global EID cursor which all worlds and all components know about
// so that world entities can posess entire rows spanning all component tables
let globalEntityCursor = 0
let globalSize = defaultSize
let resizeThreshold = () => globalSize - (globalSize / 5)

export const getGlobalSize = () => globalSize

// removed eids should also be global to prevent memory leaks
const removed = []

export const resetGlobals = () => {
  globalSize = defaultSize
  globalEntityCursor = 0
  removed.length = 0
}

export const getDefaultSize = () => defaultSize

/**
 * Sets the default maximum number of entities for worlds and component stores.
 *
 * @param {number} size
 */
export const setDefaultSize = size => { 
  defaultSize = size
  resetGlobals()
}

export const getEntityCursor = () => globalEntityCursor
export const getRemovedEntities = () => removed

export const eidToWorld = new Map()

/**
 * Adds a new entity to the specified world.
 *
 * @param {World} world
 * @returns {number} eid
 */
export const addEntity = (world) => {
  
  const eid = removed.length > 0 ? removed.shift() : globalEntityCursor++
  world[$entitySparseSet].add(eid)
  eidToWorld.set(eid, world)

  if (globalEntityCursor >= defaultSize) {
    console.error(`bitECS - max entities of ${defaultSize} reached, increase with setDefaultSize function.`)
  }
  // if data stores are 80% full
  // if (globalEntityCursor >= resizeThreshold()) {
  //   // grow by half the original size rounded up to a multiple of 4
  //   const size = globalSize
  //   const amount = Math.ceil((size/2) / 4) * 4
  //   const newSize = size + amount
  //   globalSize = newSize
  //   resizeWorlds(newSize)
  //   resizeComponents(newSize)
  //   setSerializationResized(true)
  //   console.info(`👾 bitECS - resizing all data stores from ${size} to ${size+amount}`)
  // }

  world[$notQueries].forEach(q => {
    const match = queryCheckEntity(world, q, eid)
    if (match) queryAddEntity(q, eid)
  })

  world[$entityComponents].set(eid, new Set())

  return eid
}

/**
 * Removes an existing entity from the specified world.
 *
 * @param {World} world
 * @param {number} eid
 */
export const removeEntity = (world, eid) => {
  // Check if entity is already removed
  if (!world[$entitySparseSet].has(eid)) return

  // Remove entity from all queries
  // TODO: archetype graph
  world[$queries].forEach(q => {
    queryRemoveEntity(world, q, eid)
  })

  // Free the entity
  removed.push(eid)

  // remove all eid state from world
  world[$entitySparseSet].remove(eid)
  world[$entityComponents].delete(eid)

  // Clear entity bitmasks
  for (let i = 0; i < world[$entityMasks].length; i++) world[$entityMasks][i][eid] = 0
}

/**
 *  Returns an array of components that an entity possesses.
 *
 * @param {*} world
 * @param {*} eid
 */
export const getEntityComponents = (world, eid) => Array.from(world[$entityComponents].get(eid))