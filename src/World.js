import { $componentMap } from './Component.js'
import { $queryMap, $queries, $dirtyQueries, $notQueries } from './Query.js'
import { $entityArray, $entityComponents, $entityMasks, $entitySparseSet, removeEntity } from './Entity.js'
import { resize } from './Storage.js'
import { SparseSet } from './Util.js'
import { globalUniverse } from './Universe.js'

export const $resizeThreshold = Symbol('resizeThreshold')
export const $bitflag = Symbol('bitflag')
export const $archetypes = Symbol('archetypes')
export const $localEntities = Symbol('localEntities')
export const $localEntityLookup = Symbol('localEntityLookup')
export const $universe = Symbol('universe')

// TODO
// export const resizeWorld = (world, size) => {
//   world[$worldCapacity] = size

//   for (let i = 0; i < world[$entityMasks].length; i++) {
//     const masks = world[$entityMasks][i];
//     world[$entityMasks][i] = resize(masks, size)
//   }
  
//   world[$resizeThreshold] = world[$worldCapacity] - (world[$worldCapacity] / 5)
// }

/**
 * Creates a new world.
 *
 * @returns {object}
 */
export const createWorld = (universe = globalUniverse, world = {}) => {
  world[$universe] = universe
  universe.worlds.push(world)
  return resetWorld(world)
}

/**
 * Resets a world.
 *
 * @param {World} world
 * @returns {object}
 */
export const resetWorld = (world) => {
  const cap = world[$universe].capacity

  if (world[$entityArray]) world[$entityArray].forEach(eid => removeEntity(world, eid))

  world[$entityMasks] = [new Uint32Array(cap)]
  world[$entityComponents] = new Map()
  world[$archetypes] = []

  world[$entitySparseSet] = SparseSet()
  world[$entityArray] = world[$entitySparseSet].dense

  world[$bitflag] = 1

  world[$componentMap] = new Map()

  world[$queryMap] = new Map()
  world[$queries] = new Set()
  world[$notQueries] = new Set()
  world[$dirtyQueries] = new Set()

  world[$localEntities] = new Map()
  world[$localEntityLookup] = new Map()

  return world
}

/**
 * Returns all components registered to a world
 * 
 * @param {World} world 
 * @returns Array
 */
export const getWorldComponents = (world) => Array.from(world[$componentMap].keys())

/**
 * Returns all existing entities in a world
 * 
 * @param {World} world 
 * @returns Array
 */
export const getAllEntities = (world) => world[$entitySparseSet].dense.slice(0)