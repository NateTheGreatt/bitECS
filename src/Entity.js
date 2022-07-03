import { $notQueries, $queries, queryAddEntity, queryCheckEntity, queryRemoveEntity } from './Query.js'
import { $localEntities, $localEntityLookup, $universe } from './World.js'

export const $entityMasks = Symbol('entityMasks')
export const $entityComponents = Symbol('entityComponents')
export const $entitySparseSet = Symbol('entitySparseSet')
export const $entityArray = Symbol('entityArray')
export const $entityIndices = Symbol('entityIndices')

export const eidToWorld = new Map()

/**
 * Adds a new entity to the specified world.
 *
 * @param {World} world
 * @returns {number} eid
 */
export const addEntity = (world) => {

  const { removedEntities, capacity } = world[$universe]
  
  const eid = removedEntities.length > Math.round(capacity * 0.01) ? removedEntities.shift() : world[$universe].entityCursor++
  
  world[$entitySparseSet].add(eid)
  eidToWorld.set(eid, world)

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
  world[$universe].removedEntities.push(eid)

  // remove all eid state from world
  world[$entitySparseSet].remove(eid)
  world[$entityComponents].delete(eid)

  // remove from deserializer mapping
  // TODO: remove when new serialization is implemented
  world[$localEntities].delete(world[$localEntityLookup].get(eid))
  world[$localEntityLookup].delete(eid)

  // Clear entity bitmasks
  for (let i = 0; i < world[$entityMasks].length; i++) world[$entityMasks][i][eid] = 0
}

/**
 *  Returns an array of components that an entity possesses.
 *
 * @param {*} world
 * @param {*} eid
 */
export const getEntityComponents = (world, eid) => {
  if (eid === undefined) throw new Error('bitECS - entity is undefined.')
  if (!world[$entitySparseSet].has(eid)) throw new Error('bitECS - entity does not exist in the world.')
  return Array.from(world[$entityComponents].get(eid))
}

/**
 * Checks the existence of an entity in a world
 * 
 * @param {World} world 
 * @param {number} eid 
 */
export const entityExists = (world, eid) => world[$entitySparseSet].has(eid)