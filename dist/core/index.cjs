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
  commitRemovals: () => commitRemovals,
  createEntityIndex: () => createEntityIndex,
  createRelation: () => createRelation,
  createWorld: () => createWorld,
  deleteWorld: () => deleteWorld,
  entityExists: () => entityExists,
  getAllEntities: () => getAllEntities,
  getComponentData: () => getComponentData,
  getEntityComponents: () => getEntityComponents,
  getId: () => getId,
  getRelationTargets: () => getRelationTargets,
  getVersion: () => getVersion,
  getWorldComponents: () => getWorldComponents,
  hasComponent: () => hasComponent,
  innerQuery: () => innerQuery,
  isRelation: () => isRelation,
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
  entitiesWithRelations: /* @__PURE__ */ new Set()
});
function createWorld(...args) {
  let entityIndex;
  let context;
  args.forEach((arg) => {
    if (typeof arg === "object" && "add" in arg && "remove" in arg) {
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
  return world;
};
var deleteWorld = (world) => {
  delete world[$internal];
};
var getWorldComponents = (world) => Object.keys(world[$internal].componentMap);
var getAllEntities = (world) => world[$internal].entityIndex.dense.slice(0);

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
  return {
    add,
    remove,
    has,
    sparse,
    dense,
    reset
  };
};
var createUint32SparseSet = (initialCapacity = 1e3) => {
  const sparse = [];
  let length = 0;
  let dense = new Uint32Array(initialCapacity);
  const has = (val) => val < sparse.length && sparse[val] < length && dense[sparse[val]] === val;
  const add = (val) => {
    if (has(val)) return;
    if (length >= dense.length) {
      const newDense = new Uint32Array(dense.length * 2);
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
  return {
    add,
    remove,
    has,
    sparse,
    get dense() {
      return new Uint32Array(dense.buffer, 0, length);
    },
    reset
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

// src/core/Query.ts
var $opType = Symbol("opType");
var $opTerms = Symbol("opTerms");
var Or = (...components) => ({
  [$opType]: "Or",
  [$opTerms]: components
});
var And = (...components) => ({
  [$opType]: "And",
  [$opTerms]: components
});
var Not = (...components) => ({
  [$opType]: "Not",
  [$opTerms]: components
});
var Any = Or;
var All = And;
var None = Not;
var onAdd = (...terms) => ({
  [$opType]: "add",
  [$opTerms]: terms
});
var onRemove = (...terms) => ({
  [$opType]: "remove",
  [$opTerms]: terms
});
var onSet = (component) => ({
  [$opType]: "set",
  [$opTerms]: [component]
});
var onGet = (component) => ({
  [$opType]: "get",
  [$opTerms]: [component]
});
function observe(world, hook, callback) {
  const ctx = world[$internal];
  const { [$opType]: type, [$opTerms]: components } = hook;
  if (type === "add" || type === "remove") {
    const hash = queryHash(world, components);
    let queryData = ctx.queriesHashMap.get(hash);
    if (!queryData) {
      queryData = registerQuery(world, components);
    }
    const observableKey = type === "add" ? "addObservable" : "removeObservable";
    return queryData[observableKey].subscribe(callback);
  } else if (type === "set" || type === "get") {
    if (components.length !== 1) {
      throw new Error("Set and Get hooks can only observe a single component");
    }
    const component = components[0];
    let componentData = ctx.componentMap.get(component);
    if (!componentData) {
      componentData = registerComponent(world, component);
    }
    const observableKey = type === "set" ? "setObservable" : "getObservable";
    return componentData[observableKey].subscribe(callback);
  }
  throw new Error(`Invalid hook type: ${type}`);
}
var queryHash = (world, terms) => {
  const ctx = world[$internal];
  const getComponentId = (component) => {
    if (!ctx.componentMap.has(component)) {
      registerComponent(world, component);
    }
    return ctx.componentMap.get(component).id;
  };
  const termToString = (term) => {
    if ($opType in term) {
      const componentIds = term[$opTerms].map(getComponentId);
      const sortedComponentIds = componentIds.sort((a, b) => a - b);
      const sortedType = term[$opType].toLowerCase();
      return `${sortedType}(${sortedComponentIds.join(",")})`;
    } else {
      return getComponentId(term).toString();
    }
  };
  return terms.map(termToString).sort().join("-");
};
var registerQuery = (world, terms, options = {}) => {
  const ctx = world[$internal];
  const hash = queryHash(world, terms);
  const components = [];
  const notComponents = [];
  const orComponents = [];
  const processComponents = (comps, targetArray) => {
    comps.forEach((comp) => {
      if (!ctx.componentMap.has(comp)) registerComponent(world, comp);
      targetArray.push(comp);
    });
  };
  terms.forEach((term) => {
    if ($opType in term) {
      if (term[$opType] === "Not") {
        processComponents(term[$opTerms], notComponents);
      } else if (term[$opType] === "Or") {
        processComponents(term[$opTerms], orComponents);
      }
    } else {
      if (!ctx.componentMap.has(term)) registerComponent(world, term);
      components.push(term);
    }
  });
  const mapComponents = (c) => ctx.componentMap.get(c);
  const allComponents = components.concat(notComponents.flat()).concat(orComponents.flat()).map(mapComponents);
  const sparseSet = options.buffered ? createUint32SparseSet() : createSparseSet();
  const toRemove = createSparseSet();
  const generations = allComponents.map((c) => c.generationId).reduce((a, v) => {
    if (a.includes(v)) return a;
    a.push(v);
    return a;
  }, []);
  const reduceBitflags = (a, c) => {
    if (!a[c.generationId]) a[c.generationId] = 0;
    a[c.generationId] |= c.bitflag;
    return a;
  };
  const masks = components.map(mapComponents).reduce(reduceBitflags, {});
  const notMasks = notComponents.map(mapComponents).reduce(reduceBitflags, {});
  const orMasks = orComponents.map(mapComponents).reduce(reduceBitflags, {});
  const hasMasks = allComponents.reduce(reduceBitflags, {});
  const addObservable = createObservable();
  const removeObservable = createObservable();
  const query2 = Object.assign(sparseSet, {
    components,
    notComponents,
    orComponents,
    allComponents,
    masks,
    notMasks,
    orMasks,
    hasMasks,
    generations,
    toRemove,
    addObservable,
    removeObservable,
    queues: {}
  });
  ctx.queries.add(query2);
  ctx.queriesHashMap.set(hash, query2);
  allComponents.forEach((c) => {
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
function innerQuery(world, terms, options = {}) {
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
function query(world, terms) {
  commitRemovals(world);
  return innerQuery(world, terms);
}
function queryCheckEntity(world, query2, eid) {
  const ctx = world[$internal];
  const { masks, notMasks, orMasks, generations } = query2;
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
    if (qOrMask && (eMask & qOrMask) === 0) {
      return false;
    }
  }
  return true;
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

// src/core/Relation.ts
var $relation = Symbol("relation");
var $pairTarget = Symbol("pairTarget");
var $isPairComponent = Symbol("isPairComponent");
var $relationData = Symbol("relationData");
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
      const component = data.initStore ? data.initStore() : {};
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
var Wildcard = createRelation();
var IsA = createRelation();
var getRelationTargets = (world, eid, relation) => {
  const components = getEntityComponents(world, eid);
  const targets = [];
  for (const c of components) {
    if (c[$relation] === relation && c[$pairTarget] !== Wildcard) {
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
function isRelation(component) {
  if (!component) return false;
  const symbols = Object.getOwnPropertySymbols(component);
  return symbols.includes($relationData);
}

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
var getComponentData = (world, eid, component) => {
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
var setComponent = (world, eid, component, data) => {
  const ctx = world[$internal];
  if (!entityExists(world, eid)) {
    throw new Error(`Cannot set component - entity ${eid} does not exist in the world.`);
  }
  if (!ctx.componentMap.has(component)) {
    registerComponent(world, component);
  }
  const componentData = ctx.componentMap.get(component);
  if (!hasComponent(world, eid, component)) {
    addComponent(world, eid, component);
  }
  componentData.setObservable.notify(eid, data);
};
var recursivelyInherit = (world, baseEid, inheritedEid, isFirstSuper = true) => {
  const ctx = world[$internal];
  addComponent(world, baseEid, IsA(inheritedEid));
  for (const component of getEntityComponents(world, inheritedEid)) {
    if (component === Prefab) {
      continue;
    }
    addComponent(world, baseEid, component);
    if (isFirstSuper) {
      const componentData = ctx.componentMap.get(component);
      if (componentData?.setObservable) {
        const data = getComponentData(world, inheritedEid, component);
        componentData.setObservable.notify(baseEid, data);
      }
    }
  }
  for (const inheritedEid2 of getRelationTargets(world, inheritedEid, IsA)) {
    recursivelyInherit(world, baseEid, inheritedEid2, false);
  }
};
var addComponent = (world, eid, ...components) => {
  if (!entityExists(world, eid)) {
    throw new Error(`Cannot add component - entity ${eid} does not exist in the world.`);
  }
  const ctx = world[$internal];
  components.forEach((componentOrSet) => {
    const component = "component" in componentOrSet ? componentOrSet.component : componentOrSet;
    const data = "data" in componentOrSet ? componentOrSet.data : void 0;
    if (!ctx.componentMap.has(component)) registerComponent(world, component);
    const componentData = ctx.componentMap.get(component);
    if (data !== void 0) {
      componentData.setObservable.notify(eid, data);
    }
    if (hasComponent(world, eid, component)) return;
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
    if (component[$isPairComponent]) {
      const relation = component[$relation];
      const target = component[$pairTarget];
      addComponent(world, eid, Pair(relation, Wildcard));
      addComponent(world, eid, Pair(Wildcard, target));
      if (typeof target === "number") {
        addComponent(world, target, Pair(Wildcard, relation));
        ctx.entitiesWithRelations.add(target);
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
          recursivelyInherit(world, eid, inherited);
        }
      }
    }
  });
};
var addComponents = addComponent;
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
      removeComponent(world, eid, Pair(Wildcard, target));
      const relation = component[$relation];
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
      for (const subject of innerQuery(world, [Wildcard(currentEid)])) {
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
