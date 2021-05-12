import { $componentMap } from './Component.js'
import { $queries, $queryMap, queryRemoveEntity } from './Query.js'
import { resize, resizeStore } from './Storage.js'
import { $size, $warningSize } from './World.js'

export const $entityMasks = Symbol('entityMasks')
export const $entityEnabled = Symbol('entityEnabled')
export const $entityArray = Symbol('entityArray')
export const $entityIndices = Symbol('entityIndices')
export const $removedEntities = Symbol('removedEntities')

const NONE = 2**32

// need a global EID cursor which all worlds and all components know about
// so that world entities can posess entire rows spanning all component tables
let globalEntityCursor = 0
// removed eids should also be global to prevent memory leaks
const removed = []

export const resetGlobals = () => {
  globalEntityCursor = 0
  removed.length = 0
}

export const getEntityCursor = () => globalEntityCursor
export const getRemovedEntities = () => removed

export const incrementEntityCursor = () => globalEntityCursor++

export const resizeWorld = (world, size) => {
  world[$size] = size
  
  world[$componentMap].forEach(c => {
    resizeStore(c.store, size)
  })
  
  world[$queryMap].forEach(q => {
    q.indices = resize(q.indices, size)
    q.enabled = resize(q.enabled, size)
  })
  
  world[$entityEnabled] = resize(world[$entityEnabled], size)
  world[$entityIndices] = resize(world[$entityIndices], size)
  
  for (let i = 0; i < world[$entityMasks].length; i++) {
    const masks = world[$entityMasks][i];
    world[$entityMasks][i] = resize(masks, size)
  }
}

export const addEntity = (world) => {
  const enabled = world[$entityEnabled]
  
  const eid = removed.length > 0 ? removed.shift() : globalEntityCursor++
  enabled[eid] = 1
  world[$entityIndices][eid] = world[$entityArray].push(eid) - 1

  // if data stores are 80% full
  if (globalEntityCursor >= world[$warningSize]) {
    // grow by half the original size rounded up to a multiple of 4
    const size = world[$size]
    const amount = Math.ceil((size/2) / 4) * 4
    resizeWorld(world, size + amount)
    world[$warningSize] = world[$size] - (world[$size] / 5)
    console.info(`👾 bitECS - resizing world from ${size} to ${size+amount}`)
  }

  return eid
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
  const index = world[$entityIndices][eid]

  const swapped = world[$entityArray].pop()
  if (swapped !== eid) {
    world[$entityArray][index] = swapped
    world[$entityIndices][swapped] = index
  }
  world[$entityIndices][eid] = NONE

  // Clear entity bitmasks
  for (let i = 0; i < world[$entityMasks].length; i++) world[$entityMasks][i][eid] = 0
}
