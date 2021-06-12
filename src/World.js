import { $componentMap } from './Component.js'
import { $queryMap, $queries, $dirtyQueries } from './Query.js'
import { $entityArray, $entityIndices, $entityEnabled, $entityMasks, $entitySparseSet, getGlobalSize, removeEntity } from './Entity.js'
import { resize } from './Storage.js'
import { SparseSet } from './Util.js'

export const $size = Symbol('size')
export const $resizeThreshold = Symbol('resizeThreshold')
export const $bitflag = Symbol('bitflag')

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

export const createWorld = () => {
  const world = {}
  resetWorld(world)
  worlds.push(world)
  return world
}

export const resetWorld = (world) => {
  const size = getGlobalSize()
  world[$size] = size

  world[$entityMasks] = [new Uint32Array(size)]

  if (world[$entityArray]) world[$entityArray].forEach(eid => removeEntity(world, eid))
  world[$entitySparseSet] = SparseSet()
  world[$entityArray] = world[$entitySparseSet].dense

  world[$bitflag] = 1

  world[$componentMap] = new Map()

  world[$queryMap] = new Map()
  world[$queries] = new Set()
  world[$dirtyQueries] = new Set()

  return world
}

export const deleteWorld = (world) => {
  delete world[$size]
  delete world[$entityEnabled]
  delete world[$entityMasks]
  delete world[$entityArray]
  delete world[$entityIndices]
  delete world[$bitflag]
  delete world[$componentMap]
  delete world[$queryMap]
  delete world[$queries]
  delete world[$dirtyQueries]
  Object.keys(world).forEach(key => {
    delete world[key]
  })
  worlds.splice(worlds.indexOf(world), 1)
}
