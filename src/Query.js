import { $managerSize } from './DataManager.js'
import { $componentMap } from './Component.js'
import { $entityMasks, $entityEnabled, getEntityCursor } from './Entity.js'

export const $queries = Symbol('queries')
export const $queryMap = Symbol('queryMap')
export const $queryComponents = Symbol('queryComponents')

export const registerQuery = (world, query) => {
  const components = query[$queryComponents]
  const size = components.reduce((a,c) => c[$managerSize] > a ? c[$managerSize] : a, 0)
  
  const entities = []
  const indices = new Uint32Array(size)
  const enabled = new Uint8Array(size)
  const generations = components.map(c => world[$componentMap].get(c).generationId)
  const masks = components
    .map(c => world[$componentMap].get(c))
    .reduce((a,c) => {
      if (!a[c.generationId]) a[c.generationId] = 0
      a[c.generationId] |= c.bitflag    
      return a
    }, {})

  world[$queryMap].set(query, { entities, enabled, components, masks, generations, indices })
  world[$queries].add(query)

  for (let eid = 0; eid < getEntityCursor(); eid++) {
    if (!world[$entityEnabled][eid]) continue
    if (queryCheckEntity(world, query, eid)) {
      queryAddEntity(world, query, eid)
    }
  }
}

export const defineQuery = (components) => {
  const query = function (world) {
    if (!world[$queryMap].has(query)) registerQuery(world, query)
    return world[$queryMap].get(query).entities
  }
  query[$queryComponents] = components
  return query
}

// TODO: archetype graph
export const queryCheckEntity = (world, query, eid) => {
  const { masks, generations } = world[$queryMap].get(query)
  for (let i = 0; i < generations.length; i++) {
    const generationId = generations[i]
    const qMask = masks[generationId]
    const eMask = world[$entityMasks][generationId][eid]
    if ((eMask & qMask) !== qMask) {
      return false
    }
  }
  return true
}

const queryCheckComponent = (world, query, component) => {
  const { generationId, bitflag } = world[$componentMap].get(component)
  const { masks } = world[$queryMap].get(query)
  const mask = masks[generationId]
  return (mask & bitflag) === bitflag
}

export const queryCheckComponents = (world, query, components) => {
  return components.every(c => queryCheckComponent(world, query, c))
}

export const queryAddEntity = (world, query, eid) => {
  const q = world[$queryMap].get(query)
  if (q.enabled[eid]) return
  q.enabled[eid] = true
  q.entities.push(eid)
  q.indices[eid] = q.entities.length - 1
}

export const queryRemoveEntity = (world, query, eid) => {
  const q = world[$queryMap].get(query)
  if (!q.enabled[eid]) return
  q.enabled[eid] = false
  q.entities.splice(q.indices[eid])
}
