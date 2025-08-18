var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/core/index.ts
var core_exports = {};
__export(core_exports, {
  $internal: () => $internal,
  All: () => All,
  And: () => And,
  Any: () => Any,
  Cascade: () => Cascade,
  Hierarchy: () => Hierarchy,
  IsA: () => IsA,
  None: () => None,
  Not: () => Not,
  Or: () => Or,
  Pair: () => Pair,
  Prefab: () => Prefab,
  Wildcard: () => Wildcard,
  addComponent: () => addComponent,
  addComponents: () => addComponents,
  addEntity: () => addEntity,
  addPrefab: () => addPrefab,
  asBuffer: () => asBuffer,
  commitRemovals: () => commitRemovals,
  createEntityIndex: () => createEntityIndex,
  createRelation: () => createRelation,
  createWorld: () => createWorld,
  deleteWorld: () => deleteWorld,
  entityExists: () => entityExists,
  getAllEntities: () => getAllEntities,
  getComponent: () => getComponent,
  getEntityComponents: () => getEntityComponents,
  getHierarchyDepth: () => getHierarchyDepth,
  getId: () => getId,
  getMaxHierarchyDepth: () => getMaxHierarchyDepth,
  getRelationTargets: () => getRelationTargets,
  getVersion: () => getVersion,
  getWorldComponents: () => getWorldComponents,
  hasComponent: () => hasComponent,
  isNested: () => isNested,
  isRelation: () => isRelation,
  isWildcard: () => isWildcard,
  noCommit: () => noCommit,
  observe: () => observe,
  onAdd: () => onAdd,
  onGet: () => onGet,
  onRemove: () => onRemove,
  onSet: () => onSet,
  pipe: () => pipe,
  query: () => query,
  registerComponent: () => registerComponent,
  registerComponents: () => registerComponents,
  registerQuery: () => registerQuery,
  removeComponent: () => removeComponent,
  removeComponents: () => removeComponents,
  removeEntity: () => removeEntity,
  removeQuery: () => removeQuery,
  resetWorld: () => resetWorld,
  set: () => set,
  setComponent: () => setComponent,
  withAutoRemoveSubject: () => withAutoRemoveSubject,
  withOnTargetRemoved: () => withOnTargetRemoved,
  withStore: () => withStore,
  withVersioning: () => withVersioning
});
module.exports = __toCommonJS(core_exports);

// src/core/utils/defineHiddenProperty.ts
var defineHiddenProperty = (obj, key, value) => Object.defineProperty(obj, key, {
  value,
  enumerable: false,
  writable: true,
  configurable: true
});

// src/core/EntityIndex.ts
var getId = (index, id) => id & index.entityMask;
var getVersion = (index, id) => id >>> index.versionShift & (1 << index.versionBits) - 1;
var incrementVersion = (index, id) => {
  const currentVersion = getVersion(index, id);
  const newVersion = currentVersion + 1 & (1 << index.versionBits) - 1;
  return id & index.entityMask | newVersion << index.versionShift;
};
var withVersioning = (versionBits) => ({
  versioning: true,
  versionBits
});
var createEntityIndex = (options) => {
  const config = options ? typeof options === "function" ? options() : options : { versioning: false, versionBits: 8 };
  const versionBits = config.versionBits ?? 8;
  const versioning = config.versioning ?? false;
  const entityBits = 32 - versionBits;
  const entityMask = (1 << entityBits) - 1;
  const versionShift = entityBits;
  const versionMask = (1 << versionBits) - 1 << versionShift;
  return {
    aliveCount: 0,
    dense: [],
    sparse: [],
    maxId: 0,
    versioning,
    versionBits,
    entityMask,
    versionShift,
    versionMask
  };
};
var addEntityId = (index) => {
  if (index.aliveCount < index.dense.length) {
    const recycledId = index.dense[index.aliveCount];
    const entityId = recycledId;
    index.sparse[entityId] = index.aliveCount;
    index.aliveCount++;
    return recycledId;
  }
  const id = ++index.maxId;
  index.dense.push(id);
  index.sparse[id] = index.aliveCount;
  index.aliveCount++;
  return id;
};
var removeEntityId = (index, id) => {
  const denseIndex = index.sparse[id];
  if (denseIndex === void 0 || denseIndex >= index.aliveCount) {
    return;
  }
  const lastIndex = index.aliveCount - 1;
  const lastId = index.dense[lastIndex];
  index.sparse[lastId] = denseIndex;
  index.dense[denseIndex] = lastId;
  index.sparse[id] = lastIndex;
  index.dense[lastIndex] = id;
  if (index.versioning) {
    const newId = incrementVersion(index, id);
    index.dense[lastIndex] = newId;
  }
  index.aliveCount--;
};
var isEntityIdAlive = (index, id) => {
  const entityId = getId(index, id);
  const denseIndex = index.sparse[entityId];
  return denseIndex !== void 0 && denseIndex < index.aliveCount && index.dense[denseIndex] === id;
};

// src/core/World.ts
var $internal = Symbol.for("bitecs_internal");
var createBaseWorld = (context, entityIndex) => defineHiddenProperty(context || {}, $internal, {
  entityIndex: entityIndex || createEntityIndex(),
  entityMasks: [[]],
  entityComponents: /* @__PURE__ */ new Map(),
  bitflag: 1,
  componentMap: /* @__PURE__ */ new Map(),
  componentCount: 0,
  queries: /* @__PURE__ */ new Set(),
  queriesHashMap: /* @__PURE__ */ new Map(),
  notQueries: /* @__PURE__ */ new Set(),
  dirtyQueries: /* @__PURE__ */ new Set(),
  entitiesWithRelations: /* @__PURE__ */ new Set(),
  // Initialize hierarchy tracking
  hierarchyData: /* @__PURE__ */ new Map(),
  hierarchyActiveRelations: /* @__PURE__ */ new Set(),
  hierarchyQueryCache: /* @__PURE__ */ new Map()
});
function createWorld(...args) {
  let entityIndex;
  let context;
  args.forEach((arg) => {
    if (typeof arg === "object" && "dense" in arg && "sparse" in arg && "aliveCount" in arg) {
      entityIndex = arg;
    } else if (typeof arg === "object") {
      context = arg;
    }
  });
  return createBaseWorld(context, entityIndex);
}
var resetWorld = (world) => {
  const ctx = world[$internal];
  ctx.entityIndex = createEntityIndex();
  ctx.entityMasks = [[]];
  ctx.entityComponents = /* @__PURE__ */ new Map();
  ctx.bitflag = 1;
  ctx.componentMap = /* @__PURE__ */ new Map();
  ctx.componentCount = 0;
  ctx.queries = /* @__PURE__ */ new Set();
  ctx.queriesHashMap = /* @__PURE__ */ new Map();
  ctx.notQueries = /* @__PURE__ */ new Set();
  ctx.dirtyQueries = /* @__PURE__ */ new Set();
  ctx.entitiesWithRelations = /* @__PURE__ */ new Set();
  ctx.hierarchyData = /* @__PURE__ */ new Map();
  ctx.hierarchyActiveRelations = /* @__PURE__ */ new Set();
  ctx.hierarchyQueryCache = /* @__PURE__ */ new Map();
  return world;
};
var deleteWorld = (world) => {
  delete world[$internal];
};
var getWorldComponents = (world) => Object.keys(world[$internal].componentMap);
var getAllEntities = (world) => Array.from(world[$internal].entityComponents.keys());

// src/core/utils/SparseSet.ts
var createSparseSet = () => {
  const dense = [];
  const sparse = [];
  const has = (val) => dense[sparse[val]] === val;
  const add = (val) => {
    if (has(val)) return;
    sparse[val] = dense.push(val) - 1;
  };
  const remove = (val) => {
    if (!has(val)) return;
    const index = sparse[val];
    const swapped = dense.pop();
    if (swapped !== val) {
      dense[index] = swapped;
      sparse[swapped] = index;
    }
  };
  const reset = () => {
    dense.length = 0;
    sparse.length = 0;
  };
  const sort = (compareFn) => {
    dense.sort(compareFn);
    for (let i = 0; i < dense.length; i++) {
      sparse[dense[i]] = i;
    }
  };
  return {
    add,
    remove,
    has,
    sparse,
    dense,
    reset,
    sort
  };
};
var SharedArrayBufferOrArrayBuffer = typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : ArrayBuffer;
var createUint32SparseSet = (initialCapacity = 1e3) => {
  const sparse = [];
  let length = 0;
  let dense = new Uint32Array(new SharedArrayBufferOrArrayBuffer(initialCapacity * 4));
  const has = (val) => val < sparse.length && sparse[val] < length && dense[sparse[val]] === val;
  const add = (val) => {
    if (has(val)) return;
    if (length >= dense.length) {
      const newDense = new Uint32Array(new SharedArrayBufferOrArrayBuffer(dense.length * 2 * 4));
      newDense.set(dense);
      dense = newDense;
    }
    dense[length] = val;
    sparse[val] = length;
    length++;
  };
  const remove = (val) => {
    if (!has(val)) return;
    length--;
    const index = sparse[val];
    const swapped = dense[length];
    dense[index] = swapped;
    sparse[swapped] = index;
  };
  const reset = () => {
    length = 0;
    sparse.length = 0;
  };
  const sort = (compareFn) => {
    const temp = Array.from(dense.subarray(0, length));
    temp.sort(compareFn);
    for (let i = 0; i < temp.length; i++) {
      dense[i] = temp[i];
    }
    for (let i = 0; i < length; i++) {
      sparse[dense[i]] = i;
    }
  };
  return {
    add,
    remove,
    has,
    sparse,
    get dense() {
      return new Uint32Array(dense.buffer, 0, length);
    },
    reset,
    sort
  };
};

// src/core/utils/Observer.ts
var createObservable = () => {
  const observers = /* @__PURE__ */ new Set();
  const subscribe = (observer) => {
    observers.add(observer);
    return () => {
      observers.delete(observer);
    };
  };
  const notify = (entity, ...args) => {
    return Array.from(observers).reduce((acc, listener) => {
      const result = listener(entity, ...args);
      return result && typeof result === "object" ? { ...acc, ...result } : acc;
    }, {});
  };
  return {
    subscribe,
    notify
  };
};

// src/core/Relation.ts
var $relation = Symbol.for("bitecs-relation");
var $pairTarget = Symbol.for("bitecs-pairTarget");
var $isPairComponent = Symbol.for("bitecs-isPairComponent");
var $relationData = Symbol.for("bitecs-relationData");
var createBaseRelation = () => {
  const data = {
    pairsMap: /* @__PURE__ */ new Map(),
    initStore: void 0,
    exclusiveRelation: false,
    autoRemoveSubject: false,
    onTargetRemoved: void 0
  };
  const relation = (target) => {
    if (target === void 0) throw Error("Relation target is undefined");
    const normalizedTarget = target === "*" ? Wildcard : target;
    if (!data.pairsMap.has(normalizedTarget)) {
      const component = data.initStore ? data.initStore(target) : {};
      defineHiddenProperty(component, $relation, relation);
      defineHiddenProperty(component, $pairTarget, normalizedTarget);
      defineHiddenProperty(component, $isPairComponent, true);
      data.pairsMap.set(normalizedTarget, component);
    }
    return data.pairsMap.get(normalizedTarget);
  };
  defineHiddenProperty(relation, $relationData, data);
  return relation;
};
var withStore = (createStore) => (relation) => {
  const ctx = relation[$relationData];
  ctx.initStore = createStore;
  return relation;
};
var makeExclusive = (relation) => {
  const ctx = relation[$relationData];
  ctx.exclusiveRelation = true;
  return relation;
};
var withAutoRemoveSubject = (relation) => {
  const ctx = relation[$relationData];
  ctx.autoRemoveSubject = true;
  return relation;
};
var withOnTargetRemoved = (onRemove2) => (relation) => {
  const ctx = relation[$relationData];
  ctx.onTargetRemoved = onRemove2;
  return relation;
};
var Pair = (relation, target) => {
  if (relation === void 0) throw Error("Relation is undefined");
  return relation(target);
};
var getRelationTargets = (world, eid, relation) => {
  const components = getEntityComponents(world, eid);
  const targets = [];
  for (const c of components) {
    if (c[$relation] === relation && c[$pairTarget] !== Wildcard && !isRelation(c[$pairTarget])) {
      targets.push(c[$pairTarget]);
    }
  }
  return targets;
};
function createRelation(...args) {
  if (args.length === 1 && typeof args[0] === "object") {
    const { store, exclusive, autoRemoveSubject, onTargetRemoved } = args[0];
    const modifiers = [
      store && withStore(store),
      exclusive && makeExclusive,
      autoRemoveSubject && withAutoRemoveSubject,
      onTargetRemoved && withOnTargetRemoved(onTargetRemoved)
    ].filter(Boolean);
    return modifiers.reduce((acc, modifier) => modifier(acc), createBaseRelation());
  } else {
    const modifiers = args;
    return modifiers.reduce((acc, modifier) => modifier(acc), createBaseRelation());
  }
}
var $wildcard = Symbol.for("bitecs-wildcard");
function createWildcardRelation() {
  const relation = createBaseRelation();
  Object.defineProperty(relation, $wildcard, {
    value: true,
    enumerable: false,
    writable: false,
    configurable: false
  });
  return relation;
}
function getWildcard() {
  const GLOBAL_WILDCARD = Symbol.for("bitecs-global-wildcard");
  if (!globalThis[GLOBAL_WILDCARD]) {
    globalThis[GLOBAL_WILDCARD] = createWildcardRelation();
  }
  return globalThis[GLOBAL_WILDCARD];
}
var Wildcard = getWildcard();
function createIsARelation() {
  return createBaseRelation();
}
function getIsA() {
  const GLOBAL_ISA = Symbol.for("bitecs-global-isa");
  if (!globalThis[GLOBAL_ISA]) {
    globalThis[GLOBAL_ISA] = createIsARelation();
  }
  return globalThis[GLOBAL_ISA];
}
var IsA = getIsA();
function isWildcard(relation) {
  if (!relation) return false;
  const symbols = Object.getOwnPropertySymbols(relation);
  return symbols.includes($wildcard);
}
function isRelation(component) {
  if (!component) return false;
  const symbols = Object.getOwnPropertySymbols(component);
  return symbols.includes($relationData);
}

// src/core/Hierarchy.ts
var MAX_HIERARCHY_DEPTH = 64;
var INVALID_DEPTH = 4294967295;
var DEFAULT_BUFFER_GROWTH = 1024;
function growDepthsArray(hierarchyData, entity) {
  const { depths } = hierarchyData;
  if (entity < depths.length) return depths;
  const newSize = Math.max(entity + 1, depths.length * 2, depths.length + DEFAULT_BUFFER_GROWTH);
  const newDepths = new Uint32Array(newSize);
  newDepths.fill(INVALID_DEPTH);
  newDepths.set(depths);
  hierarchyData.depths = newDepths;
  return newDepths;
}
function updateDepthCache(hierarchyData, entity, newDepth, oldDepth) {
  const { depthToEntities } = hierarchyData;
  if (oldDepth !== void 0 && oldDepth !== INVALID_DEPTH) {
    const oldSet = depthToEntities.get(oldDepth);
    if (oldSet) {
      oldSet.remove(entity);
      if (oldSet.dense.length === 0) depthToEntities.delete(oldDepth);
    }
  }
  if (newDepth !== INVALID_DEPTH) {
    if (!depthToEntities.has(newDepth)) depthToEntities.set(newDepth, createUint32SparseSet());
    depthToEntities.get(newDepth).add(entity);
  }
}
function updateMaxDepth(hierarchyData, depth) {
  if (depth > hierarchyData.maxDepth) {
    hierarchyData.maxDepth = depth;
  }
}
function setEntityDepth(hierarchyData, entity, newDepth, oldDepth) {
  hierarchyData.depths[entity] = newDepth;
  updateDepthCache(hierarchyData, entity, newDepth, oldDepth);
  updateMaxDepth(hierarchyData, newDepth);
}
function invalidateQueryCache(world, relation) {
  const ctx = world[$internal];
  ctx.hierarchyQueryCache.delete(relation);
}
function getHierarchyData(world, relation) {
  const ctx = world[$internal];
  if (!ctx.hierarchyActiveRelations.has(relation)) {
    ctx.hierarchyActiveRelations.add(relation);
    ensureDepthTracking(world, relation);
    populateExistingDepths(world, relation);
  }
  return ctx.hierarchyData.get(relation);
}
function populateExistingDepths(world, relation) {
  const entitiesWithRelation = query(world, [Pair(relation, Wildcard)]);
  for (const entity of entitiesWithRelation) {
    getEntityDepth(world, relation, entity);
  }
  const processedTargets = /* @__PURE__ */ new Set();
  for (const entity of entitiesWithRelation) {
    for (const target of getRelationTargets(world, entity, relation)) {
      if (!processedTargets.has(target)) {
        processedTargets.add(target);
        getEntityDepth(world, relation, target);
      }
    }
  }
}
function ensureDepthTracking(world, relation) {
  const ctx = world[$internal];
  if (!ctx.hierarchyData.has(relation)) {
    const initialSize = Math.max(DEFAULT_BUFFER_GROWTH, ctx.entityIndex.dense.length * 2);
    const depthArray = new Uint32Array(initialSize);
    depthArray.fill(INVALID_DEPTH);
    ctx.hierarchyData.set(relation, {
      depths: depthArray,
      dirty: createSparseSet(),
      depthToEntities: /* @__PURE__ */ new Map(),
      maxDepth: 0
    });
  }
}
function calculateEntityDepth(world, relation, entity, visited = /* @__PURE__ */ new Set()) {
  if (visited.has(entity)) return 0;
  visited.add(entity);
  const targets = getRelationTargets(world, entity, relation);
  if (targets.length === 0) return 0;
  if (targets.length === 1) return getEntityDepthWithVisited(world, relation, targets[0], visited) + 1;
  let minDepth = Infinity;
  for (const target of targets) {
    const depth = getEntityDepthWithVisited(world, relation, target, visited);
    if (depth < minDepth) {
      minDepth = depth;
      if (minDepth === 0) break;
    }
  }
  return minDepth === Infinity ? 0 : minDepth + 1;
}
function getEntityDepthWithVisited(world, relation, entity, visited) {
  const ctx = world[$internal];
  ensureDepthTracking(world, relation);
  const hierarchyData = ctx.hierarchyData.get(relation);
  let { depths } = hierarchyData;
  depths = growDepthsArray(hierarchyData, entity);
  if (depths[entity] === INVALID_DEPTH) {
    const depth = calculateEntityDepth(world, relation, entity, visited);
    setEntityDepth(hierarchyData, entity, depth);
    return depth;
  }
  return depths[entity];
}
function getEntityDepth(world, relation, entity) {
  return getEntityDepthWithVisited(world, relation, entity, /* @__PURE__ */ new Set());
}
function markChildrenDirty(world, relation, parent, dirty, visited = createSparseSet()) {
  if (visited.has(parent)) return;
  visited.add(parent);
  const children = query(world, [relation(parent)]);
  for (const child of children) {
    dirty.add(child);
    markChildrenDirty(world, relation, child, dirty, visited);
  }
}
function updateHierarchyDepth(world, relation, entity, parent, updating = /* @__PURE__ */ new Set()) {
  const ctx = world[$internal];
  if (!ctx.hierarchyActiveRelations.has(relation)) {
    return;
  }
  ensureDepthTracking(world, relation);
  const hierarchyData = ctx.hierarchyData.get(relation);
  if (updating.has(entity)) {
    hierarchyData.dirty.add(entity);
    return;
  }
  updating.add(entity);
  const { depths, dirty } = hierarchyData;
  const newDepth = parent !== void 0 ? getEntityDepth(world, relation, parent) + 1 : 0;
  if (newDepth > MAX_HIERARCHY_DEPTH) {
    return;
  }
  const oldDepth = depths[entity];
  setEntityDepth(hierarchyData, entity, newDepth, oldDepth === INVALID_DEPTH ? void 0 : oldDepth);
  if (oldDepth !== newDepth) {
    markChildrenDirty(world, relation, entity, dirty, createSparseSet());
    invalidateQueryCache(world, relation);
  }
}
function invalidateHierarchyDepth(world, relation, entity) {
  const ctx = world[$internal];
  if (!ctx.hierarchyActiveRelations.has(relation)) {
    return;
  }
  const hierarchyData = ctx.hierarchyData.get(relation);
  let { depths } = hierarchyData;
  depths = growDepthsArray(hierarchyData, entity);
  invalidateSubtree(world, relation, entity, depths, createSparseSet());
  invalidateQueryCache(world, relation);
}
function invalidateSubtree(world, relation, entity, depths, visited) {
  if (visited.has(entity)) return;
  visited.add(entity);
  const ctx = world[$internal];
  const hierarchyData = ctx.hierarchyData.get(relation);
  if (entity < depths.length) {
    const oldDepth = depths[entity];
    if (oldDepth !== INVALID_DEPTH) {
      hierarchyData.depths[entity] = INVALID_DEPTH;
      updateDepthCache(hierarchyData, entity, INVALID_DEPTH, oldDepth);
    }
  }
  const children = query(world, [relation(entity)]);
  for (const child of children) {
    invalidateSubtree(world, relation, child, depths, visited);
  }
}
function flushDirtyDepths(world, relation) {
  const ctx = world[$internal];
  const hierarchyData = ctx.hierarchyData.get(relation);
  if (!hierarchyData) return;
  const { dirty, depths } = hierarchyData;
  if (dirty.dense.length === 0) return;
  for (const entity of dirty.dense) {
    if (depths[entity] === INVALID_DEPTH) {
      const newDepth = calculateEntityDepth(world, relation, entity);
      setEntityDepth(hierarchyData, entity, newDepth);
    }
  }
  dirty.reset();
}
function queryHierarchy(world, relation, components, options = {}) {
  const ctx = world[$internal];
  getHierarchyData(world, relation);
  const queryKey = queryHash(world, [relation, ...components]);
  const cached = ctx.hierarchyQueryCache.get(relation);
  if (cached && cached.hash === queryKey) {
    return cached.result;
  }
  flushDirtyDepths(world, relation);
  queryInternal(world, components, options);
  const queryObj = ctx.queriesHashMap.get(queryHash(world, components));
  const hierarchyData = ctx.hierarchyData.get(relation);
  const { depths } = hierarchyData;
  queryObj.sort((a, b) => {
    const depthA = depths[a];
    const depthB = depths[b];
    return depthA !== depthB ? depthA - depthB : a - b;
  });
  const result = queryObj.dense;
  ctx.hierarchyQueryCache.set(relation, { hash: queryKey, result });
  return result;
}
function queryHierarchyDepth(world, relation, depth, options = {}) {
  const hierarchyData = getHierarchyData(world, relation);
  flushDirtyDepths(world, relation);
  const entitiesAtDepth = hierarchyData.depthToEntities.get(depth);
  if (entitiesAtDepth) {
    return entitiesAtDepth.dense;
  }
  return options.buffered ? new Uint32Array(0) : [];
}
function getHierarchyDepth(world, entity, relation) {
  getHierarchyData(world, relation);
  return getEntityDepthWithVisited(world, relation, entity, /* @__PURE__ */ new Set());
}
function getMaxHierarchyDepth(world, relation) {
  const hierarchyData = getHierarchyData(world, relation);
  return hierarchyData.maxDepth;
}

// src/core/Query.ts
var $opType = Symbol.for("bitecs-opType");
var $opTerms = Symbol.for("bitecs-opTerms");
var createOp = (type) => (...components) => ({ [$opType]: type, [$opTerms]: components });
var Or = createOp("Or");
var And = createOp("And");
var Not = createOp("Not");
var Any = Or;
var All = And;
var None = Not;
var $hierarchyType = Symbol.for("bitecs-hierarchyType");
var $hierarchyRel = Symbol.for("bitecs-hierarchyRel");
var $hierarchyDepth = Symbol.for("bitecs-hierarchyDepth");
var Hierarchy = (relation, depth) => ({
  [$hierarchyType]: "Hierarchy",
  [$hierarchyRel]: relation,
  [$hierarchyDepth]: depth
});
var Cascade = Hierarchy;
var $modifierType = Symbol.for("bitecs-modifierType");
var asBuffer = { [$modifierType]: "buffer" };
var isNested = { [$modifierType]: "nested" };
var noCommit = isNested;
var createHook = (type) => (...terms) => ({ [$opType]: type, [$opTerms]: terms });
var onAdd = createHook("add");
var onRemove = createHook("remove");
var onSet = (component) => ({ [$opType]: "set", [$opTerms]: [component] });
var onGet = (component) => ({ [$opType]: "get", [$opTerms]: [component] });
function observe(world, hook, callback) {
  const ctx = world[$internal];
  const { [$opType]: type, [$opTerms]: components } = hook;
  if (type === "add" || type === "remove") {
    const queryData = ctx.queriesHashMap.get(queryHash(world, components)) || registerQuery(world, components);
    return queryData[type === "add" ? "addObservable" : "removeObservable"].subscribe(callback);
  }
  if (type === "set" || type === "get") {
    if (components.length !== 1) throw new Error("Set and Get hooks can only observe a single component");
    const componentData = ctx.componentMap.get(components[0]) || registerComponent(world, components[0]);
    return componentData[type === "set" ? "setObservable" : "getObservable"].subscribe(callback);
  }
  throw new Error(`Invalid hook type: ${type}`);
}
var queryHash = (world, terms) => {
  const ctx = world[$internal];
  const getComponentId = (component) => {
    if (!ctx.componentMap.has(component)) registerComponent(world, component);
    return ctx.componentMap.get(component).id;
  };
  const termToString = (term) => $opType in term ? `${term[$opType].toLowerCase()}(${term[$opTerms].map(termToString).sort().join(",")})` : getComponentId(term).toString();
  return terms.map(termToString).sort().join("-");
};
var registerQuery = (world, terms, options = {}) => {
  const ctx = world[$internal];
  const hash = queryHash(world, terms);
  const queryComponents = [];
  const collect = (term) => {
    if ($opType in term) term[$opTerms].forEach(collect);
    else {
      if (!ctx.componentMap.has(term)) registerComponent(world, term);
      queryComponents.push(term);
    }
  };
  terms.forEach(collect);
  const components = [];
  const notComponents = [];
  const orComponents = [];
  const addToArray = (arr, comps) => {
    comps.forEach((comp) => {
      if (!ctx.componentMap.has(comp)) registerComponent(world, comp);
      arr.push(comp);
    });
  };
  terms.forEach((term) => {
    if ($opType in term) {
      const { [$opType]: type, [$opTerms]: comps } = term;
      if (type === "Not") addToArray(notComponents, comps);
      else if (type === "Or") addToArray(orComponents, comps);
      else if (type === "And") addToArray(components, comps);
      else throw new Error(`Nested combinator ${type} not supported yet - use simple queries for best performance`);
    } else {
      if (!ctx.componentMap.has(term)) registerComponent(world, term);
      components.push(term);
    }
  });
  const allComponentsData = queryComponents.map((c) => ctx.componentMap.get(c));
  const generations = [...new Set(allComponentsData.map((c) => c.generationId))];
  const reduceBitflags = (a, c) => (a[c.generationId] = (a[c.generationId] || 0) | c.bitflag, a);
  const masks = components.map((c) => ctx.componentMap.get(c)).reduce(reduceBitflags, {});
  const notMasks = notComponents.map((c) => ctx.componentMap.get(c)).reduce(reduceBitflags, {});
  const orMasks = orComponents.map((c) => ctx.componentMap.get(c)).reduce(reduceBitflags, {});
  const hasMasks = allComponentsData.reduce(reduceBitflags, {});
  const query2 = Object.assign(options.buffered ? createUint32SparseSet() : createSparseSet(), {
    allComponents: queryComponents,
    orComponents,
    notComponents,
    masks,
    notMasks,
    orMasks,
    hasMasks,
    generations,
    toRemove: createSparseSet(),
    addObservable: createObservable(),
    removeObservable: createObservable(),
    queues: {}
  });
  ctx.queries.add(query2);
  ctx.queriesHashMap.set(hash, query2);
  allComponentsData.forEach((c) => {
    c.queries.add(query2);
  });
  if (notComponents.length) ctx.notQueries.add(query2);
  const entityIndex = ctx.entityIndex;
  for (let i = 0; i < entityIndex.aliveCount; i++) {
    const eid = entityIndex.dense[i];
    if (hasComponent(world, eid, Prefab)) continue;
    const match = queryCheckEntity(world, query2, eid);
    if (match) {
      queryAddEntity(query2, eid);
    }
  }
  return query2;
};
function queryInternal(world, terms, options = {}) {
  const ctx = world[$internal];
  const hash = queryHash(world, terms);
  let queryData = ctx.queriesHashMap.get(hash);
  if (!queryData) {
    queryData = registerQuery(world, terms, options);
  } else if (options.buffered && !("buffer" in queryData.dense)) {
    queryData = registerQuery(world, terms, { buffered: true });
  }
  return queryData.dense;
}
function query(world, terms, ...modifiers) {
  const hierarchyTerm = terms.find((term) => term && typeof term === "object" && $hierarchyType in term);
  const regularTerms = terms.filter((term) => !(term && typeof term === "object" && $hierarchyType in term));
  let buffered = false, commit = true;
  const hasModifiers = modifiers.some((m) => m && typeof m === "object" && $modifierType in m);
  for (const modifier of modifiers) {
    if (hasModifiers && modifier && typeof modifier === "object" && $modifierType in modifier) {
      const mod = modifier;
      if (mod[$modifierType] === "buffer") buffered = true;
      if (mod[$modifierType] === "nested") commit = false;
    } else if (!hasModifiers) {
      const opts = modifier;
      if (opts.buffered !== void 0) buffered = opts.buffered;
      if (opts.commit !== void 0) commit = opts.commit;
    }
  }
  if (hierarchyTerm) {
    const { [$hierarchyRel]: relation, [$hierarchyDepth]: depth } = hierarchyTerm;
    return depth !== void 0 ? queryHierarchyDepth(world, relation, depth, { buffered }) : queryHierarchy(world, relation, regularTerms, { buffered });
  }
  if (commit) commitRemovals(world);
  return queryInternal(world, regularTerms, { buffered });
}
function queryCheckEntity(world, query2, eid) {
  const ctx = world[$internal];
  const { masks, notMasks, orMasks, generations } = query2;
  let hasOrMatch = Object.keys(orMasks).length === 0;
  for (let i = 0; i < generations.length; i++) {
    const generationId = generations[i];
    const qMask = masks[generationId];
    const qNotMask = notMasks[generationId];
    const qOrMask = orMasks[generationId];
    const eMask = ctx.entityMasks[generationId][eid];
    if (qNotMask && (eMask & qNotMask) !== 0) {
      return false;
    }
    if (qMask && (eMask & qMask) !== qMask) {
      return false;
    }
    if (qOrMask && (eMask & qOrMask) !== 0) {
      hasOrMatch = true;
    }
  }
  return hasOrMatch;
}
var queryAddEntity = (query2, eid) => {
  query2.toRemove.remove(eid);
  query2.addObservable.notify(eid);
  query2.add(eid);
};
var queryCommitRemovals = (query2) => {
  for (let i = 0; i < query2.toRemove.dense.length; i++) {
    const eid = query2.toRemove.dense[i];
    query2.remove(eid);
  }
  query2.toRemove.reset();
};
var commitRemovals = (world) => {
  const ctx = world[$internal];
  if (!ctx.dirtyQueries.size) return;
  ctx.dirtyQueries.forEach(queryCommitRemovals);
  ctx.dirtyQueries.clear();
};
var queryRemoveEntity = (world, query2, eid) => {
  const ctx = world[$internal];
  const has = query2.has(eid);
  if (!has || query2.toRemove.has(eid)) return;
  query2.toRemove.add(eid);
  ctx.dirtyQueries.add(query2);
  query2.removeObservable.notify(eid);
};
var removeQuery = (world, terms) => {
  const ctx = world[$internal];
  const hash = queryHash(world, terms);
  const query2 = ctx.queriesHashMap.get(hash);
  if (query2) {
    ctx.queries.delete(query2);
    ctx.queriesHashMap.delete(hash);
  }
};

// src/core/Component.ts
var registerComponent = (world, component) => {
  if (!component) {
    throw new Error(`bitECS - Cannot register null or undefined component`);
  }
  const ctx = world[$internal];
  const queries = /* @__PURE__ */ new Set();
  const data = {
    id: ctx.componentCount++,
    generationId: ctx.entityMasks.length - 1,
    bitflag: ctx.bitflag,
    ref: component,
    queries,
    setObservable: createObservable(),
    getObservable: createObservable()
  };
  ctx.componentMap.set(component, data);
  ctx.bitflag *= 2;
  if (ctx.bitflag >= 2 ** 31) {
    ctx.bitflag = 1;
    ctx.entityMasks.push([]);
  }
  return data;
};
var registerComponents = (world, components) => {
  components.forEach((component) => registerComponent(world, component));
};
var hasComponent = (world, eid, component) => {
  const ctx = world[$internal];
  const registeredComponent = ctx.componentMap.get(component);
  if (!registeredComponent) return false;
  const { generationId, bitflag } = registeredComponent;
  const mask = ctx.entityMasks[generationId][eid];
  return (mask & bitflag) === bitflag;
};
var getComponent = (world, eid, component) => {
  const ctx = world[$internal];
  const componentData = ctx.componentMap.get(component);
  if (!componentData) {
    return void 0;
  }
  if (!hasComponent(world, eid, component)) {
    return void 0;
  }
  return componentData.getObservable.notify(eid);
};
var set = (component, data) => ({
  component,
  data
});
var recursivelyInherit = (ctx, world, baseEid, inheritedEid, visited = /* @__PURE__ */ new Set()) => {
  if (visited.has(inheritedEid)) return;
  visited.add(inheritedEid);
  addComponent(world, baseEid, IsA(inheritedEid));
  for (const component of getEntityComponents(world, inheritedEid)) {
    if (component === Prefab) continue;
    if (!hasComponent(world, baseEid, component)) {
      addComponent(world, baseEid, component);
      const componentData = ctx.componentMap.get(component);
      if (componentData?.setObservable) {
        const data = getComponent(world, inheritedEid, component);
        componentData.setObservable.notify(baseEid, data);
      }
    }
  }
  for (const parentEid of getRelationTargets(world, inheritedEid, IsA)) {
    recursivelyInherit(ctx, world, baseEid, parentEid, visited);
  }
};
var setComponent = (world, eid, component, data) => {
  addComponent(world, eid, set(component, data));
};
var addComponent = (world, eid, componentOrSet) => {
  if (!entityExists(world, eid)) {
    throw new Error(`Cannot add component - entity ${eid} does not exist in the world.`);
  }
  const ctx = world[$internal];
  const component = "component" in componentOrSet ? componentOrSet.component : componentOrSet;
  const data = "data" in componentOrSet ? componentOrSet.data : void 0;
  if (!ctx.componentMap.has(component)) registerComponent(world, component);
  const componentData = ctx.componentMap.get(component);
  if (hasComponent(world, eid, component)) {
    if (data !== void 0) {
      componentData.setObservable.notify(eid, data);
    }
    return false;
  }
  const { generationId, bitflag, queries } = componentData;
  ctx.entityMasks[generationId][eid] |= bitflag;
  if (!hasComponent(world, eid, Prefab)) {
    queries.forEach((queryData) => {
      queryData.toRemove.remove(eid);
      const match = queryCheckEntity(world, queryData, eid);
      if (match) queryAddEntity(queryData, eid);
      else queryRemoveEntity(world, queryData, eid);
    });
  }
  ctx.entityComponents.get(eid).add(component);
  if (data !== void 0) {
    componentData.setObservable.notify(eid, data);
  }
  if (component[$isPairComponent]) {
    const relation = component[$relation];
    const target = component[$pairTarget];
    addComponents(world, eid, Pair(relation, Wildcard), Pair(Wildcard, target));
    if (typeof target === "number") {
      addComponents(world, target, Pair(Wildcard, eid), Pair(Wildcard, relation));
      ctx.entitiesWithRelations.add(target);
      ctx.entitiesWithRelations.add(eid);
    }
    ctx.entitiesWithRelations.add(target);
    const relationData = relation[$relationData];
    if (relationData.exclusiveRelation === true && target !== Wildcard) {
      const oldTarget = getRelationTargets(world, eid, relation)[0];
      if (oldTarget !== void 0 && oldTarget !== null && oldTarget !== target) {
        removeComponent(world, eid, relation(oldTarget));
      }
    }
    if (relation === IsA) {
      const inheritedTargets = getRelationTargets(world, eid, IsA);
      for (const inherited of inheritedTargets) {
        recursivelyInherit(ctx, world, eid, inherited);
      }
    }
    updateHierarchyDepth(world, relation, eid, typeof target === "number" ? target : void 0);
  }
  return true;
};
function addComponents(world, eid, ...args) {
  const components = Array.isArray(args[0]) ? args[0] : args;
  components.forEach((componentOrSet) => {
    addComponent(world, eid, componentOrSet);
  });
}
var removeComponent = (world, eid, ...components) => {
  const ctx = world[$internal];
  if (!entityExists(world, eid)) {
    throw new Error(`Cannot remove component - entity ${eid} does not exist in the world.`);
  }
  components.forEach((component) => {
    if (!hasComponent(world, eid, component)) return;
    const componentNode = ctx.componentMap.get(component);
    const { generationId, bitflag, queries } = componentNode;
    ctx.entityMasks[generationId][eid] &= ~bitflag;
    queries.forEach((queryData) => {
      queryData.toRemove.remove(eid);
      const match = queryCheckEntity(world, queryData, eid);
      if (match) queryAddEntity(queryData, eid);
      else queryRemoveEntity(world, queryData, eid);
    });
    ctx.entityComponents.get(eid).delete(component);
    if (component[$isPairComponent]) {
      const target = component[$pairTarget];
      const relation = component[$relation];
      invalidateHierarchyDepth(world, relation, eid);
      removeComponent(world, eid, Pair(Wildcard, target));
      if (typeof target === "number" && entityExists(world, target)) {
        removeComponent(world, target, Pair(Wildcard, eid));
        removeComponent(world, target, Pair(Wildcard, relation));
      }
      const otherTargets = getRelationTargets(world, eid, relation);
      if (otherTargets.length === 0) {
        removeComponent(world, eid, Pair(relation, Wildcard));
      }
    }
  });
};
var removeComponents = removeComponent;

// src/core/Entity.ts
var Prefab = {};
var addPrefab = (world) => {
  const eid = addEntity(world);
  addComponent(world, eid, Prefab);
  return eid;
};
var addEntity = (world) => {
  const ctx = world[$internal];
  const eid = addEntityId(ctx.entityIndex);
  ctx.notQueries.forEach((q) => {
    const match = queryCheckEntity(world, q, eid);
    if (match) queryAddEntity(q, eid);
  });
  ctx.entityComponents.set(eid, /* @__PURE__ */ new Set());
  return eid;
};
var removeEntity = (world, eid) => {
  const ctx = world[$internal];
  if (!isEntityIdAlive(ctx.entityIndex, eid)) return;
  const removalQueue = [eid];
  const processedEntities = /* @__PURE__ */ new Set();
  while (removalQueue.length > 0) {
    const currentEid = removalQueue.shift();
    if (processedEntities.has(currentEid)) continue;
    processedEntities.add(currentEid);
    const componentRemovalQueue = [];
    if (ctx.entitiesWithRelations.has(currentEid)) {
      for (const subject of query(world, [Wildcard(currentEid)], noCommit)) {
        if (!entityExists(world, subject)) {
          continue;
        }
        for (const component of ctx.entityComponents.get(subject)) {
          if (!component[$isPairComponent]) {
            continue;
          }
          const relation = component[$relation];
          const relationData = relation[$relationData];
          componentRemovalQueue.push(() => removeComponent(world, subject, Pair(Wildcard, currentEid)));
          if (component[$pairTarget] === currentEid) {
            componentRemovalQueue.push(() => removeComponent(world, subject, component));
            if (relationData.autoRemoveSubject) {
              removalQueue.push(subject);
            }
            if (relationData.onTargetRemoved) {
              componentRemovalQueue.push(() => relationData.onTargetRemoved(world, subject, currentEid));
            }
          }
        }
      }
      ctx.entitiesWithRelations.delete(currentEid);
    }
    for (const removeOperation of componentRemovalQueue) {
      removeOperation();
    }
    for (const eid2 of removalQueue) {
      removeEntity(world, eid2);
    }
    for (const query2 of ctx.queries) {
      queryRemoveEntity(world, query2, currentEid);
    }
    removeEntityId(ctx.entityIndex, currentEid);
    ctx.entityComponents.delete(currentEid);
    for (let i = 0; i < ctx.entityMasks.length; i++) {
      ctx.entityMasks[i][currentEid] = 0;
    }
  }
};
var getEntityComponents = (world, eid) => {
  const ctx = world[$internal];
  if (eid === void 0) throw new Error(`getEntityComponents: entity id is undefined.`);
  if (!isEntityIdAlive(ctx.entityIndex, eid))
    throw new Error(`getEntityComponents: entity ${eid} does not exist in the world.`);
  return Array.from(ctx.entityComponents.get(eid));
};
var entityExists = (world, eid) => isEntityIdAlive(world[$internal].entityIndex, eid);

// src/core/utils/pipe.ts
var pipe = (...functions) => {
  return (...args) => functions.reduce((result, fn) => [fn(...result)], args)[0];
};
//# sourceMappingURL=index.cjs.map
