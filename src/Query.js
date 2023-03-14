import { SparseSet } from './Util.js'
import { $queryShadow, $storeFlattened, $tagStore, createShadow } from './Storage.js'
import { $componentMap, registerComponent } from './Component.js'
import { $entityMasks, $entityArray, getEntityCursor, $entitySparseSet } from './Entity.js'

export const $modifier = Symbol("$modifier")

function modifier(c, mod) {
  const inner = () => [c, mod]
  inner[$modifier] = true
  return inner
}

export const Not = (c) => modifier(c, 'not')
export const Or = (c) => modifier(c, 'or')
export const Changed = (c) => modifier(c, 'changed')

export function Any(...comps) { return function QueryAny() { return comps } }
export function All(...comps) { return function QueryAll() { return comps } }
export function None(...comps) { return function QueryNone() { return comps } }

export const $queries = Symbol('queries')
export const $notQueries = Symbol('notQueries')

export const $queryAny = Symbol('queryAny')
export const $queryAll = Symbol('queryAll')
export const $queryNone = Symbol('queryNone')

export const $queryMap = Symbol('queryMap')
export const $dirtyQueries = Symbol('$dirtyQueries')
export const $queryComponents = Symbol('queryComponents')
export const $enterQuery = Symbol('enterQuery')
export const $exitQuery = Symbol('exitQuery')

const empty = Object.freeze([])

/**
 * Given an existing query, returns a new function which returns entities who have been added to the given query since the last call of the function.
 *
 * @param {function} query
 * @returns {function} enteredQuery
 */
export const enterQuery = query => world => {
  if (!world[$queryMap].has(query)) registerQuery(world, query)
  const q = world[$queryMap].get(query)
  if (q.entered.dense.length === 0) {
    return empty
  } else {
    const results = q.entered.dense.slice()
    q.entered.reset()
    return results
  }
}

/**
 * Given an existing query, returns a new function which returns entities who have been removed from the given query since the last call of the function.
 *
 * @param {function} query
 * @returns {function} enteredQuery
 */
export const exitQuery = query => world => {
  if (!world[$queryMap].has(query)) registerQuery(world, query)
  const q = world[$queryMap].get(query)
  if (q.exited.dense.length === 0) {
    return empty
  } else {
    const results = q.exited.dense.slice()
    q.exited.reset()
    return results
  }
}

export const registerQuery = (world, query) => {

  const components = []
  const notComponents = []
  const changedComponents = []

  query[$queryComponents].forEach(c => {
    if (typeof c === "function" && c[$modifier]) {
      const [comp, mod] = c()
      if (!world[$componentMap].has(comp)) registerComponent(world, comp)
      if (mod === 'not') {
        notComponents.push(comp)
      }
      if (mod === 'changed') {
        changedComponents.push(comp)
        components.push(comp)
      }
      // if (mod === 'all') {
      //   allComponents.push(comp)
      // }
      // if (mod === 'any') {
      //   anyComponents.push(comp)
      // }
      // if (mod === 'none') {
      //   noneComponents.push(comp)
      // }
    } else {
      if (!world[$componentMap].has(c)) registerComponent(world, c)
      components.push(c)
    }
  })


  const mapComponents = c => world[$componentMap].get(c)

  const allComponents = components.concat(notComponents).map(mapComponents)

  // const sparseSet = Uint32SparseSet(getGlobalSize())
  const sparseSet = SparseSet()

  const archetypes = []
  // const changed = SparseSet()
  const changed = []
  const toRemove = SparseSet()
  const entered = SparseSet()
  const exited = SparseSet()

  const generations = allComponents
    .map(c => c.generationId)
    .reduce((a,v) => {
      if (a.includes(v)) return a
      a.push(v)
      return a
    }, [])

  const reduceBitflags = (a,c) => {
    if (!a[c.generationId]) a[c.generationId] = 0
    a[c.generationId] |= c.bitflag
    return a
  }
  const masks = components
    .map(mapComponents)
    .reduce(reduceBitflags, {})

  const notMasks = notComponents
    .map(mapComponents)
    .reduce(reduceBitflags, {})

  // const orMasks = orComponents
  //   .map(mapComponents)
  //   .reduce(reduceBitmasks, {})

  const hasMasks = allComponents
    .reduce(reduceBitflags, {})

  const flatProps = components
    .filter(c => !c[$tagStore])
    .map(c => Object.getOwnPropertySymbols(c).includes($storeFlattened) ? c[$storeFlattened] : [c])
    .reduce((a,v) => a.concat(v), [])

  const shadows = []

  const q = Object.assign(sparseSet, {
    archetypes,
    changed,
    components,
    notComponents,
    changedComponents,
    allComponents,
    masks,
    notMasks,
    // orMasks,
    hasMasks,
    generations,
    flatProps,
    toRemove,
    entered,
    exited,
    shadows,
  })

  world[$queryMap].set(query, q)
  world[$queries].add(q)
  
  allComponents.forEach(c => {
    c.queries.add(q)
  })

  if (notComponents.length) world[$notQueries].add(q)

  for (let eid = 0; eid < getEntityCursor(); eid++) {
    if (!world[$entitySparseSet].has(eid)) continue
    const match = queryCheckEntity(world, q, eid)
    if (match) queryAddEntity(q, eid)
  }
}

const generateShadow = (q, pid) => {
  const $ = Symbol()
  const prop = q.flatProps[pid]
  createShadow(prop, $)
  q.shadows[pid] = prop[$]
  return prop[$]
}

const diff = (q, clearDiff) => {
  if (clearDiff) q.changed = []
  const { flatProps, shadows } = q
  for (let i = 0; i < q.dense.length; i++) {
    const eid = q.dense[i]
    let dirty = false
    for (let pid = 0; pid < flatProps.length; pid++) {
      const prop = flatProps[pid]
      const shadow = shadows[pid] || generateShadow(q, pid)
      if (ArrayBuffer.isView(prop[eid])) {
        for (let i = 0; i < prop[eid].length; i++) {
          if (prop[eid][i] !== shadow[eid][i]) {
            dirty = true
            break
          }
        }
        shadow[eid].set(prop[eid])
      } else {
        if (prop[eid] !== shadow[eid]) {
          dirty = true
          shadow[eid] = prop[eid]
        }
      }
    }
    if (dirty) q.changed.push(eid)
  }
  return q.changed
}

// const queryEntityChanged = (q, eid) => {
//   if (q.changed.has(eid)) return
//   q.changed.add(eid)
// }

// export const entityChanged = (world, component, eid) => {
//   const { changedQueries } = world[$componentMap].get(component)
//   changedQueries.forEach(q => {
//     const match = queryCheckEntity(world, q, eid)
//     if (match) queryEntityChanged(q, eid)
//   })
// }

const flatten = (a,v) => a.concat(v)

const aggregateComponentsFor = mod => x => x.filter(f => f.name === mod().constructor.name).reduce(flatten)

const getAnyComponents = aggregateComponentsFor(Any)
const getAllComponents = aggregateComponentsFor(All)
const getNoneComponents = aggregateComponentsFor(None)

/**
 * Defines a query function which returns a matching set of entities when called on a world.
 *
 * @param {array} components
 * @returns {function} query
 */

export const defineQuery = (...args) => {
  let components
  let any, all, none
  if (Array.isArray(args[0])) {
    components = args[0]
  } else {
    // any = getAnyComponents(args)
    // all = getAllComponents(args)
    // none = getNoneComponents(args)
  }
  

  if (components === undefined || components[$componentMap] !== undefined) {
    return world => world ? world[$entityArray] : components[$entityArray]
  }

  const query = function (world, clearDiff=true) {
    if (!world[$queryMap].has(query)) registerQuery(world, query)

    const q = world[$queryMap].get(query)

    commitRemovals(world)

    if (q.changedComponents.length) return diff(q, clearDiff)
    // if (q.changedComponents.length) return q.changed.dense

    return q.dense
  }

  query[$queryComponents] = components
  query[$queryAny] = any
  query[$queryAll] = all
  query[$queryNone] = none

  return query
}

const bin = value => {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError('value must be a safe integer');
  }

  const negative = value < 0;
  const twosComplement = negative ? Number.MAX_SAFE_INTEGER + value + 1 : value;
  const signExtend = negative ? '1' : '0';

  return twosComplement.toString(2).padStart(4, '0').padStart(0, signExtend);
}

// TODO: archetype graph
export const queryCheckEntity = (world, q, eid) => {
  const { masks, notMasks, generations } = q
  let or = 0
  for (let i = 0; i < generations.length; i++) {
    const generationId = generations[i]
    const qMask = masks[generationId]
    const qNotMask = notMasks[generationId]
    // const qOrMask = orMasks[generationId]
    const eMask = world[$entityMasks][generationId][eid]
    
    // any
    // if (qOrMask && (eMask & qOrMask) !== qOrMask) {
    //   continue
    // }
    // not all 
    // if (qNotMask && (eMask & qNotMask) === qNotMask) {
    // }
    // not any
    if (qNotMask && (eMask & qNotMask) !== 0) {
      return false
    }
    // all
    if (qMask && (eMask & qMask) !== qMask) {
      return false
    }
  }
  return true
}

export const queryCheckComponent = (q, c) => {
  const { generationId, bitflag } = c
  const { hasMasks } = q
  const mask = hasMasks[generationId]
  return (mask & bitflag) === bitflag
}

export const queryAddEntity = (q, eid) => {
  q.toRemove.remove(eid)
  // if (!q.has(eid)) 
  q.entered.add(eid)
  q.add(eid)
}

const queryCommitRemovals = (q) => {
  for (let i = q.toRemove.dense.length-1; i >= 0; i--) {
    const eid = q.toRemove.dense[i]
    q.toRemove.remove(eid)
    q.remove(eid)
  }
}

export const commitRemovals = (world) => {
  if (!world[$dirtyQueries].size) return
  world[$dirtyQueries].forEach(queryCommitRemovals)
  world[$dirtyQueries].clear()
}

export const queryRemoveEntity = (world, q, eid) => {
  if (!q.has(eid) || q.toRemove.has(eid)) return
  q.toRemove.add(eid)
  world[$dirtyQueries].add(q)
  q.exited.add(eid)
}


/**
 * Resets a Changed-based query, clearing the underlying list of changed entities.
 *
 * @param {World} world
 * @param {function} query
 */
export const resetChangedQuery = (world, query) => {
  const q = world[$queryMap].get(query)
  q.changed = []
}

/**
 * Removes a query from a world.
 *
 * @param {World} world
 * @param {function} query
 */
export const removeQuery = (world, query) => {
  const q = world[$queryMap].get(query)
  world[$queries].delete(q)
  world[$queryMap].delete(query)
}