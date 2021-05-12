import { $componentMap } from './Component.js'
import { $queryMap, $queries, $dirtyQueries } from './Query.js'
import { $entityArray, $entityIndices, $entityEnabled, $entityMasks } from './Entity.js'

export const $size = Symbol('size')
export const $warningSize = Symbol('warningSize')
export const $bitflag = Symbol('bitflag')

export const createWorld = (size = 10000) => {
  const world = {}
  
  world[$size] = size

  world[$entityEnabled] = new Uint8Array(size)
  world[$entityMasks] = [new Uint32Array(size)]

  world[$entityArray] = []
  world[$entityIndices] = new Uint32Array(size)

  world[$bitflag] = 1

  world[$componentMap] = new Map()

  world[$queryMap] = new Map()
  world[$queries] = new Set()
  world[$dirtyQueries] = new Set()

  world[$warningSize] = size - (size / 5)

  return world
}