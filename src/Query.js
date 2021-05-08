import { $queryShadow, $storeFlattened, $storeSize } from './Storage.js'
import { $componentMap, registerComponent } from './Component.js'
import { $entityMasks, $entityEnabled, getEntityCursor } from './Entity.js'

export function Not(c) { return function QueryNot() { return c } }
export function Changed(c) { return function QueryChanged() { return c } }

export const $queries = Symbol('queries')
export const $queryMap = Symbol('queryMap')
export const $dirtyQueries = Symbol('$dirtyQueries')
export const $queryComponents = Symbol('queryComponents')
export const $enterQuery = Symbol('enterQuery')
export const $exitQuery = Symbol('exitQuery')

const NONE = 2**32

// TODO: linked list of functions
export const enterQuery = (world, query, fn) => {
  if (!world[$queryMap].has(query)) registerQuery(world, query)
  world[$queryMap].get(query).enter = fn
}

export const exitQuery = (world, query, fn) => {
  if (!world[$queryMap].has(query)) registerQuery(world, query)
  world[$queryMap].get(query).exit = fn
}

export const registerQuery = (world, query) => {

  let components = []
  let notComponents = []
  let changedComponents = []

  query[$queryComponents].forEach(c => {
    if (typeof c === 'function') {
      if (c.name === 'QueryNot') {
        notComponents.push(c())
      }
      if (c.name === 'QueryChanged') {
        changedComponents.push(c())
        components.push(c())
      }
    } else {
      components.push(c)
    }
  })

  const mapComponents = c => world[$componentMap].get(c)

  const size = components.concat(notComponents).reduce((a,c) => c[$storeSize] > a ? c[$storeSize] : a, 0)

  const entities = []
  const changed = []
  const indices = new Uint32Array(size).fill(NONE)
  const enabled = new Uint8Array(size)
  const generations = components
    .concat(notComponents)
    .map (c => {
      if (!world[$componentMap].has(c)) registerComponent(world, c)
      return c
    })
    .map(mapComponents)
    .map(c => c.generationId)
    .reduce((a,v) => {
      if (a.includes(v)) return a
      a.push(v)
      return a
    }, [])

  const reduceBitmasks = (a,c) => {
    if (!a[c.generationId]) a[c.generationId] = 0
    a[c.generationId] |= c.bitflag
    return a
  }
  const masks = components
    .map(mapComponents)
    .reduce(reduceBitmasks, {})

  const notMasks = notComponents
    .map(mapComponents)
    .reduce((a,c) => {
      if (!a[c.generationId]) {
        a[c.generationId] = 0
        a[c.generationId] |= c.bitflag
      }
      return a
    }, {})

  const flatProps = components
    .map(c => Object.getOwnPropertySymbols(c).includes($storeFlattened) ? c[$storeFlattened] : [c])
    .reduce((a,v) => a.concat(v), [])

  const toRemove = []
  const entered = []
  const exited = []

  world[$queryMap].set(query, { 
    entities,
    changed,
    enabled,
    components,
    notComponents,
    changedComponents,
    masks,
    notMasks,
    generations,
    indices,
    flatProps,
    toRemove,
    entered,
    exited,
  })
  
  world[$queries].add(query)

  for (let eid = 0; eid < getEntityCursor(); eid++) {
    if (!world[$entityEnabled][eid]) continue
    if (queryCheckEntity(world, query, eid)) {
      queryAddEntity(world, query, eid)
    }
  }
}

const queryHooks = (q) => {
  while (q.entered.length) if (q.enter) { q.enter(q.entered.shift()) } else q.entered.length = 0
  while (q.exited.length) if (q.exit) { q.exit(q.exited.shift()) } else q.exited.length = 0
}

const diff = (q) => {
  q.changed.length = 0
  const flat = q.flatProps
  for (let i = 0; i < q.entities.length; i++) {
    const eid = q.entities[i]
    let dirty = false
    for (let pid = 0; pid < flat.length; pid++) {
      const prop = flat[pid]
      if (ArrayBuffer.isView(prop[eid])) {
        for (let i = 0; i < prop[eid].length; i++) {
          if (prop[eid][i] !== prop[eid][$queryShadow][i]) {
            dirty = true
            prop[eid][$queryShadow][i] = prop[eid][i]
          }
        }
      } else {
        if (prop[eid] !== prop[$queryShadow][eid]) {
          dirty = true
          prop[$queryShadow][eid] = prop[eid]
        }
      }
    }
    if (dirty) q.changed.push(eid)
  }
  return q.changed
}

export const defineQuery = (components) => {
  const query = function (world) {
    if (!world[$queryMap].has(query)) registerQuery(world, query)
    const q = world[$queryMap].get(query) 
    queryHooks(q)
    queryCommitRemovals(world, q)
    if (q.changedComponents.length) return diff(q)
    return q.entities
  }
  query[$queryComponents] = components
  return query
}

// TODO: archetype graph
export const queryCheckEntity = (world, query, eid) => {
  const { masks, notMasks, generations } = world[$queryMap].get(query)
  for (let i = 0; i < generations.length; i++) {
    const generationId = generations[i]
    const qMask = masks[generationId]
    const qNotMask = notMasks[generationId]
    const eMask = world[$entityMasks][generationId][eid]
    if (qNotMask && (eMask & qNotMask) !== 0) {
      return false
    }
    if (qMask && (eMask & qMask) !== qMask) {
      return false
    }
  }
  return true
}

export const queryCheckComponent = (world, query, component) => {
  const { generationId, bitflag } = world[$componentMap].get(component)
  const { masks } = world[$queryMap].get(query)
  const mask = masks[generationId]
  return (mask & bitflag) === bitflag
}

export const queryAddEntity = (world, query, eid) => {
  const q = world[$queryMap].get(query)
  if (q.enabled[eid]) return
  q.enabled[eid] = true
  q.entities.push(eid)
  q.indices[eid] = q.entities.length - 1
  q.entered.push(eid)
}

const queryCommitRemovals = (world, q) => {
  while (q.toRemove.length) {
    const eid = q.toRemove.pop()
    const index = q.indices[eid]
    if (index === NONE) continue

    const swapped = q.entities.pop()
    if (swapped !== eid) {
      q.entities[index] = swapped
      q.indices[swapped] = index
    }
    q.indices[eid] = NONE
  }
  world[$dirtyQueries].delete(q)
}

export const commitRemovals = (world) => {
  world[$dirtyQueries].forEach(q => {
    queryCommitRemovals(world, q)
  })
}

export const queryRemoveEntity = (world, query, eid) => {
  const q = world[$queryMap].get(query)
  if (!q.enabled[eid]) return
  q.enabled[eid] = false
  q.toRemove.push(eid)
  world[$dirtyQueries].add(q)
  q.exited.push(eid)
}
