import { $componentMap, resizeComponents } from './Component.js'
import { $notQueries, $queries, $queryMap, queryAddEntity, queryCheckEntity, queryRemoveEntity } from './Query.js'
import { resize, resizeStore } from './Storage.js'
import { $size, $resizeThreshold, worlds, resizeWorlds } from './World.js'
import { setSerializationResized } from './Serialize.js'

export const $entityMasks = Symbol('entityMasks')
export const $entityEnabled = Symbol('entityEnabled')
export const $entitySparseSet = Symbol('entitySparseSet')
export const $entityArray = Symbol('entityArray')
export const $entityIndices = Symbol('entityIndices')
export const $removedEntities = Symbol('removedEntities')

let defaultSize = 100000

// need a global EID cursor which all worlds and all components know about
// so that world entities can posess entire rows spanning all component tables
let globalEntityCursor = 0
let globalSize = defaultSize
const threshold = globalSize - (globalSize / 5)
let resizeThreshold = () => threshold

export const getGlobalSize = () => globalSize

// removed eids should also be global to prevent memory leaks
const removed = []

export const resetGlobals = () => {
  globalSize = defaultSize
  globalEntityCursor = 0
  removed.length = 0
}

export const getDefaultSize = () => defaultSize
export const setDefaultSize = x => { 
  defaultSize = x
  resetGlobals()
}

export const getEntityCursor = () => globalEntityCursor
export const getRemovedEntities = () => removed

export const eidToWorld = new Map()

export const addEntity = (world) => {
  
  const eid = removed.length > 0 ? removed.shift() : globalEntityCursor++
  world[$entitySparseSet].add(eid)
  eidToWorld.set(eid, world)

  // if data stores are 80% full
  if (globalEntityCursor >= resizeThreshold()) {
    // grow by half the original size rounded up to a multiple of 4
    const size = globalSize
    const amount = Math.ceil((size/2) / 4) * 4
    const newSize = size + amount
    globalSize = newSize
    resizeWorlds(newSize)
    resizeComponents(newSize)
    setSerializationResized(true)
    console.info(`👾 bitECS - resizing all worlds from ${size} to ${size+amount}`)
  }

  world[$notQueries].forEach(q => {
    const match = queryCheckEntity(world, q, eid)
    if (match) queryAddEntity(q, eid)
  })

  return eid
}

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

  // pop swap
  world[$entitySparseSet].remove(eid)

  // Clear entity bitmasks
  for (let i = 0; i < world[$entityMasks].length; i++) world[$entityMasks][i][eid] = 0
}