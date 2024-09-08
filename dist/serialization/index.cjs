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

// src/serialization/index.ts
var serialization_exports = {};
__export(serialization_exports, {
  createObserverDeserializer: () => createObserverDeserializer,
  createObserverSerializer: () => createObserverSerializer,
  createSnapshotDeserializer: () => createSnapshotDeserializer,
  createSnapshotSerializer: () => createSnapshotSerializer,
  createSoADeserializer: () => createSoADeserializer,
  createSoASerializer: () => createSoASerializer,
  f32: () => f32,
  f64: () => f64,
  i16: () => i16,
  i32: () => i32,
  i8: () => i8,
  u16: () => u16,
  u32: () => u32,
  u8: () => u8
});
module.exports = __toCommonJS(serialization_exports);

// src/serialization/SoASerializer.ts
var $u8 = Symbol("u8");
var $i8 = Symbol("i8");
var $u16 = Symbol("u16");
var $i16 = Symbol("i16");
var $u32 = Symbol("u32");
var $i32 = Symbol("i32");
var $f32 = Symbol("f32");
var $f64 = Symbol("f64");
var typeTagForSerialization = (symbol) => (a = []) => Object.defineProperty(a, symbol, { value: true, enumerable: false, writable: false, configurable: false });
var u8 = typeTagForSerialization($u8);
var i8 = typeTagForSerialization($i8);
var u16 = typeTagForSerialization($u16);
var i16 = typeTagForSerialization($i16);
var u32 = typeTagForSerialization($u32);
var i32 = typeTagForSerialization($i32);
var f32 = typeTagForSerialization($f32);
var f64 = typeTagForSerialization($f64);
var typeSetters = {
  [$u8]: (view, offset, value) => {
    view.setUint8(offset, value);
    return 1;
  },
  [$i8]: (view, offset, value) => {
    view.setInt8(offset, value);
    return 1;
  },
  [$u16]: (view, offset, value) => {
    view.setUint16(offset, value);
    return 2;
  },
  [$i16]: (view, offset, value) => {
    view.setInt16(offset, value);
    return 2;
  },
  [$u32]: (view, offset, value) => {
    view.setUint32(offset, value);
    return 4;
  },
  [$i32]: (view, offset, value) => {
    view.setInt32(offset, value);
    return 4;
  },
  [$f32]: (view, offset, value) => {
    view.setFloat32(offset, value);
    return 4;
  },
  [$f64]: (view, offset, value) => {
    view.setFloat64(offset, value);
    return 8;
  }
};
var typeGetters = {
  [$u8]: (view, offset) => ({ value: view.getUint8(offset), size: 1 }),
  [$i8]: (view, offset) => ({ value: view.getInt8(offset), size: 1 }),
  [$u16]: (view, offset) => ({ value: view.getUint16(offset), size: 2 }),
  [$i16]: (view, offset) => ({ value: view.getInt16(offset), size: 2 }),
  [$u32]: (view, offset) => ({ value: view.getUint32(offset), size: 4 }),
  [$i32]: (view, offset) => ({ value: view.getInt32(offset), size: 4 }),
  [$f32]: (view, offset) => ({ value: view.getFloat32(offset), size: 4 }),
  [$f64]: (view, offset) => ({ value: view.getFloat64(offset), size: 8 })
};
var createComponentSerializer = (component) => {
  const props = Object.keys(component);
  const types = props.map((prop) => {
    const arr = component[prop];
    for (const symbol of [$u8, $i8, $u16, $i16, $u32, $i32, $f32, $f64]) {
      if (symbol in arr) return symbol;
    }
    return $f64;
  });
  const setters = types.map((type) => typeSetters[type] || (() => {
    throw new Error(`Unsupported or unannotated type`);
  }));
  return (view, offset, index) => {
    let bytesWritten = 0;
    bytesWritten += typeSetters[$u32](view, offset + bytesWritten, index);
    for (let i = 0; i < props.length; i++) {
      bytesWritten += setters[i](view, offset + bytesWritten, component[props[i]][index]);
    }
    return bytesWritten;
  };
};
var createComponentDeserializer = (component) => {
  const props = Object.keys(component);
  const types = props.map((prop) => {
    const arr = component[prop];
    for (const symbol of [$u8, $i8, $u16, $i16, $u32, $i32, $f32, $f64]) {
      if (symbol in arr) return symbol;
    }
    return $f64;
  });
  const getters = types.map((type) => typeGetters[type] || (() => {
    throw new Error(`Unsupported or unannotated type`);
  }));
  return (view, offset, entityIdMapping) => {
    let bytesRead = 0;
    const { value: originalIndex, size: indexSize } = typeGetters[$u32](view, offset + bytesRead);
    bytesRead += indexSize;
    const index = entityIdMapping ? entityIdMapping.get(originalIndex) ?? originalIndex : originalIndex;
    for (let i = 0; i < props.length; i++) {
      const { value, size } = getters[i](view, offset + bytesRead);
      component[props[i]][index] = value;
      bytesRead += size;
    }
    return bytesRead;
  };
};
var createSoASerializer = (components, buffer = new ArrayBuffer(1024 * 1024 * 100)) => {
  const view = new DataView(buffer);
  const componentSerializers = components.map(createComponentSerializer);
  return (indices) => {
    let offset = 0;
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      for (let j = 0; j < componentSerializers.length; j++) {
        offset += componentSerializers[j](view, offset, index);
      }
    }
    return buffer.slice(0, offset);
  };
};
var createSoADeserializer = (components) => {
  const componentDeserializers = components.map(createComponentDeserializer);
  return (packet, entityIdMapping) => {
    const view = new DataView(packet);
    let offset = 0;
    while (offset < packet.byteLength) {
      for (let i = 0; i < componentDeserializers.length; i++) {
        offset += componentDeserializers[i](view, offset, entityIdMapping);
      }
    }
  };
};

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

// src/core/utils/defineHiddenProperty.ts
var defineHiddenProperty = (obj, key, value) => Object.defineProperty(obj, key, {
  value,
  enumerable: false,
  writable: true,
  configurable: true
});

// src/core/EntityIndex.ts
var addEntityId = (index) => {
  if (index.aliveCount < index.dense.length) {
    const recycledId = index.dense[index.aliveCount];
    index.sparse[recycledId] = index.aliveCount;
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
  const record = index.sparse[id];
  if (record === void 0 || record >= index.aliveCount) {
    return;
  }
  const denseIndex = record;
  const lastIndex = index.aliveCount - 1;
  const lastId = index.dense[lastIndex];
  index.sparse[lastId] = denseIndex;
  index.dense[denseIndex] = lastId;
  index.sparse[id] = index.dense.length;
  index.dense[lastIndex] = id;
  index.aliveCount--;
};
var isEntityIdAlive = (index, id) => {
  const record = index.sparse[id];
  return record !== void 0 && index.dense[record] === id;
};

// src/core/World.ts
var $internal = Symbol.for("bitecs_internal");

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
var onAdd = (...terms) => ({
  [$opType]: "add",
  [$opTerms]: terms
});
var onRemove = (...terms) => ({
  [$opType]: "remove",
  [$opTerms]: terms
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
var queryRemoveEntity = (world, query2, eid) => {
  const ctx = world[$internal];
  const has = query2.has(eid);
  if (!has || query2.toRemove.has(eid)) return;
  query2.toRemove.add(eid);
  ctx.dirtyQueries.add(query2);
  query2.removeObservable.notify(eid);
};

// src/serialization/ObserverSerializer.ts
var createObserverSerializer = (world, networkedTag, components, buffer = new ArrayBuffer(1024 * 1024 * 100)) => {
  const dataView = new DataView(buffer);
  let offset = 0;
  const queue = [];
  observe(world, onAdd(networkedTag), (eid) => {
    queue.push([eid, 0 /* AddEntity */, -1]);
  });
  observe(world, onRemove(networkedTag), (eid) => {
    queue.push([eid, 1 /* RemoveEntity */, -1]);
  });
  components.forEach((component, i) => {
    observe(world, onAdd(networkedTag, component), (eid) => {
      queue.push([eid, 2 /* AddComponent */, i]);
    });
    observe(world, onRemove(networkedTag, component), (eid) => {
      queue.push([eid, 3 /* RemoveComponent */, i]);
    });
  });
  return () => {
    offset = 0;
    for (let i = 0; i < queue.length; i++) {
      const [entityId, type, componentId] = queue[i];
      dataView.setUint32(offset, entityId);
      offset += 4;
      dataView.setUint8(offset, type);
      offset += 1;
      dataView.setUint8(offset, componentId);
      offset += 1;
    }
    queue.length = 0;
    return buffer.slice(0, offset);
  };
};
var createObserverDeserializer = (world, networkedTag, components, entityIdMapping = /* @__PURE__ */ new Map()) => {
  return (packet) => {
    const dataView = new DataView(packet);
    let offset = 0;
    while (offset < packet.byteLength) {
      const packetEntityId = dataView.getUint32(offset);
      offset += 4;
      const operationType = dataView.getUint8(offset);
      offset += 1;
      const componentId = dataView.getUint8(offset);
      offset += 1;
      const component = components[componentId];
      let worldEntityId = entityIdMapping.get(packetEntityId);
      if (worldEntityId === void 0) {
        worldEntityId = addEntity(world);
        entityIdMapping.set(packetEntityId, worldEntityId);
      }
      if (operationType === 0 /* AddEntity */) {
        addComponent(world, worldEntityId, networkedTag);
      } else if (operationType === 1 /* RemoveEntity */) {
        removeEntity(world, worldEntityId);
      } else if (operationType === 2 /* AddComponent */) {
        addComponent(world, worldEntityId, component);
      } else if (operationType === 3 /* RemoveComponent */) {
        removeComponent(world, worldEntityId, component);
      }
    }
    return entityIdMapping;
  };
};

// src/legacy/index.ts
var $modifier = Symbol("$modifier");

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

// src/core/Entity.ts
var Prefab = {};
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
  if (eid === void 0) throw new Error("bitECS - entity is undefined.");
  if (!isEntityIdAlive(ctx.entityIndex, eid))
    throw new Error("bitECS - entity does not exist in the world.");
  return Array.from(ctx.entityComponents.get(eid));
};
var entityExists = (world, eid) => isEntityIdAlive(world[$internal].entityIndex, eid);

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
var recursivelyInherit = (world, baseEid, inheritedEid) => {
  const ctx = world[$internal];
  addComponent(world, baseEid, IsA(inheritedEid));
  const components = getEntityComponents(world, inheritedEid);
  for (const component of components) {
    if (component === Prefab) {
      continue;
    }
    addComponent(world, baseEid, component);
    const componentData = ctx.componentMap.get(component);
    if (componentData && componentData.setObservable) {
      const data = getComponentData(world, inheritedEid, component);
      componentData.setObservable.notify(baseEid, data);
    }
  }
  const inheritedTargets = getRelationTargets(world, inheritedEid, IsA);
  for (const inheritedEid2 of inheritedTargets) {
    recursivelyInherit(world, baseEid, inheritedEid2);
  }
};
var addComponent = (world, eid, ...components) => {
  const ctx = world[$internal];
  if (!entityExists(world, eid)) {
    throw new Error(`Cannot add component - entity ${eid} does not exist in the world.`);
  }
  components.forEach((componentOrSet) => {
    const component = "component" in componentOrSet ? componentOrSet.component : componentOrSet;
    const data = "data" in componentOrSet ? componentOrSet.data : void 0;
    if (!ctx.componentMap.has(component)) registerComponent(world, component);
    if (hasComponent(world, eid, component)) return;
    const componentData = ctx.componentMap.get(component);
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
      addComponent(world, eid, Pair(relation, Wildcard));
      const target = component[$pairTarget];
      addComponent(world, eid, Pair(Wildcard, target));
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

// src/serialization/SnapshotSerializer.ts
var import_core = require("../core");
var createSnapshotSerializer = (world, components, buffer = new ArrayBuffer(1024 * 1024 * 100)) => {
  const dataView = new DataView(buffer);
  let offset = 0;
  const serializeEntityComponentRelationships = (entities) => {
    const entityCount = entities.length;
    dataView.setUint32(offset, entityCount);
    offset += 4;
    for (let i = 0; i < entityCount; i++) {
      const entityId = entities[i];
      let componentCount = 0;
      dataView.setUint32(offset, entityId);
      offset += 4;
      const componentCountOffset = offset;
      offset += 1;
      for (let j = 0; j < components.length; j++) {
        if (hasComponent(world, entityId, components[j])) {
          dataView.setUint8(offset, j);
          offset += 1;
          componentCount++;
        }
      }
      dataView.setUint8(componentCountOffset, componentCount);
    }
  };
  const serializeComponentData = (entities) => {
    const soaSerializer = createSoASerializer(components, buffer.slice(offset));
    const componentData = soaSerializer(entities);
    new Uint8Array(buffer).set(new Uint8Array(componentData), offset);
    offset += componentData.byteLength;
  };
  return () => {
    offset = 0;
    const entities = (0, import_core.getAllEntities)(world);
    serializeEntityComponentRelationships(entities);
    serializeComponentData(entities);
    return buffer.slice(0, offset);
  };
};
var createSnapshotDeserializer = (world, components) => {
  const soaDeserializer = createSoADeserializer(components);
  return (packet) => {
    const dataView = new DataView(packet);
    let offset = 0;
    const entityIdMap = /* @__PURE__ */ new Map();
    const entityCount = dataView.getUint32(offset);
    offset += 4;
    for (let entityIndex = 0; entityIndex < entityCount; entityIndex++) {
      const packetEntityId = dataView.getUint32(offset);
      offset += 4;
      const worldEntityId = (0, import_core.addEntity)(world);
      entityIdMap.set(packetEntityId, worldEntityId);
      const componentCount = dataView.getUint8(offset);
      offset += 1;
      for (let i = 0; i < componentCount; i++) {
        const componentIndex = dataView.getUint8(offset);
        offset += 1;
        addComponent(world, worldEntityId, components[componentIndex]);
      }
    }
    soaDeserializer(packet.slice(offset), entityIdMap);
    return entityIdMap;
  };
};
//# sourceMappingURL=index.cjs.map
