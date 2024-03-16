import { SparseSet, Uint32SparseSet } from "../utils/SparseSet.js";
import { registerComponent } from "../component/Component.js";
import { $componentMap } from "../component/symbols.js";
import {
  $entityMasks,
  $entityArray,
  $entitySparseSet,
} from "../entity/symbols.js";
import { getEntityCursor, getGlobalSize } from "../entity/Entity.js";
import { Component, ComponentNode } from "../component/types.js";
import { TODO } from "../utils/types.js";
import {
  $dirtyQueries,
  $modifier,
  $notQueries,
  $queries,
  $queryAll,
  $queryAny,
  $queryComponents,
  $queryMap,
  $queryNone,
} from "./symbols.js";
import { Query, QueryModifier } from "./types.js";
import { World } from "../world/types.js";
import { createShadow } from "../storage/Storage.js";
import { $storeFlattened, $tagStore } from "../storage/symbols.js";

function modifier(c: Component, mod: string): QueryModifier {
  const inner: TODO = () => [c, mod] as const;
  inner[$modifier] = true;
  return inner;
}

export const Not = (c: Component) => modifier(c, "not");
export const Or = (c: Component) => modifier(c, "or");
export const Changed = (c: Component) => modifier(c, "changed");

export function Any(...comps: Component[]) {
  return function QueryAny() {
    return comps;
  };
}
export function All(...comps: Component[]) {
  return function QueryAll() {
    return comps;
  };
}
export function None(...comps: Component[]) {
  return function QueryNone() {
    return comps;
  };
}

const empty = Object.freeze([]);

/**
 * Given an existing query, returns a new function which returns entities who have been added to the given query since the last call of the function.
 *
 * @param {function} query
 * @returns {function} enteredQuery
 */
export const enterQuery = (query: Query) => (world: World) => {
  if (!world[$queryMap].has(query)) registerQuery(world, query);
  const q = world[$queryMap].get(query);
  if (q.entered.dense.length === 0) {
    return empty;
  } else {
    const results = q.entered.dense.slice();
    q.entered.reset();
    return results;
  }
};

/**
 * Given an existing query, returns a new function which returns entities who have been removed from the given query since the last call of the function.
 *
 * @param {function} query
 * @returns {function} enteredQuery
 */
export const exitQuery = (query: Query) => (world: World) => {
  if (!world[$queryMap].has(query)) registerQuery(world, query);
  const q = world[$queryMap].get(query);
  if (q.exited.dense.length === 0) {
    return empty;
  } else {
    const results = q.exited.dense.slice();
    q.exited.reset();
    return results;
  }
};

export const registerQuery = (world: World, query: TODO) => {
  const components: TODO = [];
  const notComponents: TODO = [];
  const changedComponents: TODO = [];

  query[$queryComponents].forEach((c: TODO) => {
    if (typeof c === "function" && c[$modifier]) {
      const [comp, mod] = c();
      if (!world[$componentMap].has(comp)) registerComponent(world, comp);
      if (mod === "not") {
        notComponents.push(comp);
      }
      if (mod === "changed") {
        changedComponents.push(comp);
        components.push(comp);
      }
    } else {
      if (!world[$componentMap].has(c)) registerComponent(world, c);
      components.push(c);
    }
  });

  const mapComponents = (c: Component) => world[$componentMap].get(c)!;

  const allComponents = components.concat(notComponents).map(mapComponents);

  const sparseSet = Uint32SparseSet(getGlobalSize())
  // const sparseSet = SparseSet();

  const archetypes: TODO = [];
  // const changed = SparseSet()
  const changed: TODO = [];
  const toRemove = SparseSet();
  const entered = SparseSet();
  const exited = SparseSet();

  const generations = allComponents
    .map((c: TODO) => c.generationId)
    .reduce((a: TODO, v: TODO) => {
      if (a.includes(v)) return a;
      a.push(v);
      return a;
    }, []);

  const reduceBitflags = (a: TODO, c: TODO) => {
    if (!a[c.generationId]) a[c.generationId] = 0;
    a[c.generationId] |= c.bitflag;
    return a;
  };

  const masks = components.map(mapComponents).reduce(reduceBitflags, {});
  const notMasks = notComponents.map(mapComponents).reduce(reduceBitflags, {});
  const hasMasks = allComponents.reduce(reduceBitflags, {});

  const flatProps = components
    .filter((c: TODO) => !c[$tagStore])
    .map((c: TODO) =>
      Object.getOwnPropertySymbols(c).includes($storeFlattened)
        ? c[$storeFlattened]
        : [c]
    )
    .reduce((a: TODO, v: TODO) => a.concat(v), []);

  const shadows: TODO = [];

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
  });

  world[$queryMap].set(query, q);
  world[$queries].add(q);

  allComponents.forEach((c: TODO) => {
    c.queries.add(q);
  });

  if (notComponents.length) world[$notQueries].add(q);

  for (let eid = 0; eid < getEntityCursor(); eid++) {
    if (!world[$entitySparseSet].has(eid)) continue;
    const match = queryCheckEntity(world, q, eid);
    if (match) queryAddEntity(q, eid);
  }
};

const generateShadow = (q: TODO, pid: number) => {
  const $ = Symbol();
  const prop = q.flatProps[pid];
  createShadow(prop, $);
  q.shadows[pid] = prop[$];
  return prop[$];
};

const diff = (q: TODO, clearDiff: boolean) => {
  if (clearDiff) q.changed = [];
  const { flatProps, shadows } = q;
  for (let i = 0; i < q.dense.length; i++) {
    const eid = q.dense[i];
    let dirty = false;
    for (let pid = 0; pid < flatProps.length; pid++) {
      const prop = flatProps[pid];
      const shadow = shadows[pid] || generateShadow(q, pid);
      if (ArrayBuffer.isView(prop[eid])) {
        for (let i = 0; i < prop[eid].length; i++) {
          if (prop[eid][i] !== shadow[eid][i]) {
            dirty = true;
            break;
          }
        }
        shadow[eid].set(prop[eid]);
      } else {
        if (prop[eid] !== shadow[eid]) {
          dirty = true;
          shadow[eid] = prop[eid];
        }
      }
    }
    if (dirty) q.changed.push(eid);
  }
  return q.changed;
};

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

const flatten = (a: Array<number>, v: Array<number>) => a.concat(v);

const aggregateComponentsFor = (mod: TODO) => (x: TODO) =>
  x.filter((f: TODO) => f.name === mod().constructor.name).reduce(flatten);

const getAnyComponents = aggregateComponentsFor(Any);
const getAllComponents = aggregateComponentsFor(All);
const getNoneComponents = aggregateComponentsFor(None);

/**
 * Defines a query function which returns a matching set of entities when called on a world.
 *
 * @param {array} components
 * @returns {function} query
 */

export const defineQuery = (...args: TODO) => {
  let components: TODO;
  let any, all, none;
  if (Array.isArray(args[0])) {
    components = args[0];
  } else {
    // any = getAnyComponents(args)
    // all = getAllComponents(args)
    // none = getNoneComponents(args)
  }

  if (components === undefined || components[$componentMap] !== undefined) {
    return (world: World, clearDiff = false): number[] =>
      world ? world[$entityArray] : components[$entityArray];
  }

  const query = function (world: World, clearDiff = true): ArrayLike<number> {
    if (!world[$queryMap].has(query)) registerQuery(world, query);

    const q = world[$queryMap].get(query);

    commitRemovals(world);

    if (q.changedComponents.length) return diff(q, clearDiff);
    if (q.changedComponents.length) return q.changed.dense;

    return new Uint32Array(q.dense.buffer, 0, q.count());
  };

  query[$queryComponents] = components;
  query[$queryAny] = any;
  query[$queryAll] = all;
  query[$queryNone] = none;

  return query;
};

// TODO: archetype graph
export const queryCheckEntity = (world: World, q: TODO, eid: number) => {
  const { masks, notMasks, generations } = q;
  let or = 0;
  for (let i = 0; i < generations.length; i++) {
    const generationId = generations[i];
    const qMask = masks[generationId];
    const qNotMask = notMasks[generationId];
    // const qOrMask = orMasks[generationId]
    const eMask = world[$entityMasks][generationId][eid];

    // any
    // if (qOrMask && (eMask & qOrMask) !== qOrMask) {
    //   continue
    // }
    // not all
    // if (qNotMask && (eMask & qNotMask) === qNotMask) {
    // }
    // not any
    if (qNotMask && (eMask & qNotMask) !== 0) {
      return false;
    }
    // all
    if (qMask && (eMask & qMask) !== qMask) {
      return false;
    }
  }
  return true;
};

export const queryCheckComponent = (q: TODO, c: TODO) => {
  const { generationId, bitflag } = c;
  const { hasMasks } = q;
  const mask = hasMasks[generationId];
  return (mask & bitflag) === bitflag;
};

export const queryAddEntity = (q: TODO, eid: number) => {
  q.toRemove.remove(eid);
  // if (!q.has(eid))
  q.entered.add(eid);
  q.add(eid);
};

const queryCommitRemovals = (q: TODO) => {
  for (let i = q.toRemove.dense.length - 1; i >= 0; i--) {
    const eid = q.toRemove.dense[i];
    q.toRemove.remove(eid);
    q.remove(eid);
  }
};

export const commitRemovals = (world: World) => {
  if (!world[$dirtyQueries].size) return;
  world[$dirtyQueries].forEach(queryCommitRemovals);
  world[$dirtyQueries].clear();
};

export const queryRemoveEntity = (world: World, q: TODO, eid: number) => {
  if (!q.has(eid) || q.toRemove.has(eid)) return;
  q.toRemove.add(eid);
  world[$dirtyQueries].add(q);
  q.exited.add(eid);
};

/**
 * Resets a Changed-based query, clearing the underlying list of changed entities.
 *
 * @param {World} world
 * @param {function} query
 */
export const resetChangedQuery = (world: World, query: TODO) => {
  const q = world[$queryMap].get(query);
  q.changed = [];
};

/**
 * Removes a query from a world.
 *
 * @param {World} world
 * @param {function} query
 */
export const removeQuery = (world: World, query: Query) => {
  const q = world[$queryMap].get(query);
  world[$queries].delete(q);
  world[$queryMap].delete(query);
};
