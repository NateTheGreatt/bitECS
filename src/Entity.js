import { $componentMap, resizeComponents } from './Component.js'
import { $queries, $queryMap, queryRemoveEntity } from './Query.js'
import { resize, resizeStore } from './Storage.js'
import { $size, $resizeThreshold, worlds, resizeWorlds } from './World.js'
import { setSerializationResized } from './Serialize.js'

export const $entityMasks = Symbol('entityMasks')
export const $entityEnabled = Symbol('entityEnabled')
export const $entityArray = Symbol('entityArray')
export const $entityIndices = Symbol('entityIndices')
export const $removedEntities = Symbol('removedEntities')

const NONE = 2**32 - 1

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
export const setDefaultSize = x => { 
  defaultSize = x
  resetGlobals()
}

export const getEntityCursor = () => globalEntityCursor
export const getRemovedEntities = () => removed

export const eidToWorld = new Map()

export const addEntity = (world) => {
  const enabled = world[$entityEnabled]
  
  const eid = removed.length > 0 ? removed.shift() : globalEntityCursor++
  enabled[eid] = 1
  world[$entityIndices][eid] = world[$entityArray].push(eid) - 1
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

  return eid
}

const popSwap = (world, eid) => {
  // pop swap
  const index = world[$entityIndices][eid]

  const swapped = world[$entityArray].pop()
  if (swapped !== eid) {
    world[$entityArray][index] = swapped
    world[$entityIndices][swapped] = index
  }
  world[$entityIndices][eid] = NONE
}

export const removeEntity = (world, eid) => {
  const enabled = world[$entityEnabled]

  // Check if entity is already removed
  if (enabled[eid] === 0) return

  // Remove entity from all queries
  // TODO: archetype graph
  world[$queries].forEach(query => {
    queryRemoveEntity(world, query, eid)
  })

  // Free the entity
  removed.push(eid)
  enabled[eid] = 0

  // pop swap
  popSwap(world, eid)

  // Clear entity bitmasks
  for (let i = 0; i < world[$entityMasks].length; i++) world[$entityMasks][i][eid] = 0
}