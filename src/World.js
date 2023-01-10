import { $componentMap } from './Component.js'
import { $queryMap, $queries, $dirtyQueries, $notQueries } from './Query.js'
import { $entityArray, $entityComponents, $entityMasks, $entitySparseSet, getGlobalSize, removeEntity } from './Entity.js'
import { resize } from './Storage.js'
import { SparseSet } from './Util.js'

export const $size = Symbol('size')
export const $resizeThreshold = Symbol('resizeThreshold')
export const $bitflag = Symbol('bitflag')
export const $archetypes = Symbol('archetypes')
export const $localEntities = Symbol('localEntities')
export const $localEntityLookup = Symbol('localEntityLookup')
export const $manualEntityRecycling = Symbol('manualEntityRecycling')

export const worlds = []

export const resizeWorlds = (size) => {
  worlds.forEach(world => {
    world[$size] = size

    for (let i = 0; i < world[$entityMasks].length; i++) {
      const masks = world[$entityMasks][i];
      world[$entityMasks][i] = resize(masks, size)
    }
    
    world[$resizeThreshold] = world[$size] - (world[$size] / 5)
  })
}

/**
 * Creates a new world.
 *
 * @returns {object}
 */
export const createWorld = (...args) => {
  const world = typeof args[0] === 'object'
    ? args[0]
    : {}
  const size = typeof args[0] === 'number' 
    ? args[0] 
    : typeof args[1] === 'number' 
      ? args[1] 
      : getGlobalSize()
  resetWorld(world, size)
  worlds.push(world)
  return world
}

export const enableManualEntityRecycling = (world) => {
  world[$manualEntityRecycling] = true
}

/**
 * Resets a world.
 *
 * @param {World} world
 * @returns {object}
 */
export const resetWorld = (world, size = getGlobalSize()) => {
  world[$size] = size

  if (world[$entityArray]) world[$entityArray].forEach(eid => removeEntity(world, eid))

  world[$entityMasks] = [new Uint32Array(size)]
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

  world[$manualEntityRecycling] = false

  return world
}

/**
 * Deletes a world.
 *
 * @param {World} world
 */
export const deleteWorld = (world) => {
  Object.getOwnPropertySymbols(world).forEach($ => { delete world[$] })
  Object.keys(world).forEach(key => { delete world[key] })
  worlds.splice(worlds.indexOf(world), 1)
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