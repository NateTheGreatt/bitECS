// ../../src/core/utils/SparseSet.ts
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

// ../../src/core/utils/defineHiddenProperty.ts
var defineHiddenProperty = (obj, key, value) => Object.defineProperty(obj, key, {
  value,
  enumerable: false,
  writable: true,
  configurable: true
});

// ../../src/core/EntityIndex.ts
var getId = (index, id) => id & index.entityMask;
var isEntityIdAlive = (index, id) => {
  const entityId = getId(index, id);
  const denseIndex = index.sparse[entityId];
  return denseIndex !== void 0 && denseIndex < index.aliveCount && index.dense[denseIndex] === id;
};

// ../../src/core/World.ts
var $internal = Symbol.for("bitecs_internal");

// ../../src/core/Relation.ts
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
var withOnTargetRemoved = (onRemove3) => (relation) => {
  const ctx = relation[$relationData];
  ctx.onTargetRemoved = onRemove3;
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
    return modifiers.reduce((acc, modifier2) => modifier2(acc), createBaseRelation());
  } else {
    const modifiers = args;
    return modifiers.reduce((acc, modifier2) => modifier2(acc), createBaseRelation());
  }
}

// ../../src/core/Entity.ts
var Prefab = {};
var getEntityComponents = (world, eid) => {
  const ctx = world[$internal];
  if (eid === void 0) throw new Error(`getEntityComponents: entity id is undefined.`);
  if (!isEntityIdAlive(ctx.entityIndex, eid))
    throw new Error(`getEntityComponents: entity ${eid} does not exist in the world.`);
  return Array.from(ctx.entityComponents.get(eid));
};
var entityExists = (world, eid) => isEntityIdAlive(world[$internal].entityIndex, eid);

// ../../src/core/utils/Observer.ts
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

// ../../src/core/Component.ts
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

// ../../src/core/Query.ts
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

// ../../src/serialization/ObserverSerializer.ts
import {
  addComponent as addComponent2,
  removeComponent as removeComponent2,
  addEntity as addEntity2,
  removeEntity as removeEntity2,
  observe as observe2,
  onAdd as onAdd2,
  onRemove as onRemove2,
  entityExists as entityExists2,
  isRelation as isRelation2,
  getRelationTargets as getRelationTargets2,
  Wildcard as Wildcard2
} from "bitecs";
var createObserverSerializer = (world, networkedTag, components, buffer = new ArrayBuffer(1024 * 1024 * 100)) => {
  const dataView = new DataView(buffer);
  let offset = 0;
  const queue = [];
  const relationTargets = /* @__PURE__ */ new Map();
  observe2(world, onAdd2(networkedTag), (eid) => {
    queue.push([eid, 0 /* AddEntity */, -1]);
  });
  observe2(world, onRemove2(networkedTag), (eid) => {
    queue.push([eid, 1 /* RemoveEntity */, -1]);
    relationTargets.delete(eid);
  });
  components.forEach((component, i) => {
    if (isRelation2(component)) {
      observe2(world, onAdd2(networkedTag, component(Wildcard2)), (eid) => {
        const targets = getRelationTargets2(world, eid, component);
        for (const target of targets) {
          if (!relationTargets.has(eid)) {
            relationTargets.set(eid, /* @__PURE__ */ new Map());
          }
          relationTargets.get(eid).set(i, target);
          queue.push([eid, 4 /* AddRelation */, i, target]);
        }
      });
      observe2(world, onRemove2(networkedTag, component(Wildcard2)), (eid) => {
        const targetMap = relationTargets.get(eid);
        if (targetMap) {
          const target = targetMap.get(i);
          if (target !== void 0) {
            queue.push([eid, 5 /* RemoveRelation */, i, target]);
            targetMap.delete(i);
            if (targetMap.size === 0) {
              relationTargets.delete(eid);
            }
          }
        }
      });
    } else {
      observe2(world, onAdd2(networkedTag, component), (eid) => {
        queue.push([eid, 2 /* AddComponent */, i]);
      });
      observe2(world, onRemove2(networkedTag, component), (eid) => {
        queue.push([eid, 3 /* RemoveComponent */, i]);
      });
    }
  });
  return () => {
    offset = 0;
    for (let i = 0; i < queue.length; i++) {
      const [entityId, type, componentId, targetId] = queue[i];
      dataView.setUint32(offset, entityId);
      offset += 4;
      dataView.setUint8(offset, type);
      offset += 1;
      if (type === 2 /* AddComponent */ || type === 3 /* RemoveComponent */ || type === 4 /* AddRelation */ || type === 5 /* RemoveRelation */) {
        dataView.setUint8(offset, componentId);
        offset += 1;
        if (type === 4 /* AddRelation */ || type === 5 /* RemoveRelation */) {
          dataView.setUint32(offset, targetId);
          offset += 4;
        }
      }
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
      let componentId = -1;
      let targetId = -1;
      if (operationType === 2 /* AddComponent */ || operationType === 3 /* RemoveComponent */ || operationType === 4 /* AddRelation */ || operationType === 5 /* RemoveRelation */) {
        componentId = dataView.getUint8(offset);
        offset += 1;
        if (operationType === 4 /* AddRelation */ || operationType === 5 /* RemoveRelation */) {
          targetId = dataView.getUint32(offset);
          offset += 4;
        }
      }
      const component = components[componentId];
      let worldEntityId = entityIdMapping.get(packetEntityId);
      if (operationType === 0 /* AddEntity */) {
        if (worldEntityId === void 0) {
          worldEntityId = addEntity2(world);
          entityIdMapping.set(packetEntityId, worldEntityId);
          addComponent2(world, worldEntityId, networkedTag);
        } else {
          throw new Error(`Entity with ID ${packetEntityId} already exists in the mapping.`);
        }
      } else if (worldEntityId !== void 0 && entityExists2(world, worldEntityId)) {
        if (operationType === 1 /* RemoveEntity */) {
          removeEntity2(world, worldEntityId);
        } else if (operationType === 2 /* AddComponent */) {
          addComponent2(world, worldEntityId, component);
        } else if (operationType === 3 /* RemoveComponent */) {
          removeComponent2(world, worldEntityId, component);
        } else if (operationType === 4 /* AddRelation */) {
          const worldTargetId = entityIdMapping.get(targetId);
          if (worldTargetId !== void 0) {
            addComponent2(world, worldEntityId, component(worldTargetId));
          }
        } else if (operationType === 5 /* RemoveRelation */) {
          const worldTargetId = entityIdMapping.get(targetId);
          if (worldTargetId !== void 0) {
            removeComponent2(world, worldEntityId, component(worldTargetId));
          }
        }
      }
    }
    return entityIdMapping;
  };
};

// ../../src/serialization/SoASerializer.ts
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

// ../../src/legacy/serialization.ts
function defineSerializer(components, maxBytes) {
  const initSet = /* @__PURE__ */ new WeakSet();
  let serializeObservations, serializeData;
  return (world, ents) => {
    if (!initSet.has(world)) {
      initSet.add(world);
      serializeObservations = createObserverSerializer(world, components[0], components);
      serializeData = createSoASerializer(components);
    }
    const observerData = serializeObservations();
    const soaData = serializeData(ents);
    const combinedData = new ArrayBuffer(observerData.byteLength + soaData.byteLength);
    const combinedView = new Uint8Array(combinedData);
    combinedView.set(new Uint8Array(observerData), 0);
    combinedView.set(new Uint8Array(soaData), observerData.byteLength);
    return combinedData;
  };
}
function defineDeserializer(components) {
  const initSet = /* @__PURE__ */ new WeakSet();
  let deserializeObservations, deserializeData;
  return (world, packet, mode) => {
    if (!initSet.has(world)) {
      initSet.add(world);
      deserializeObservations = createObserverDeserializer(world, components[0], components);
      deserializeData = createSoADeserializer(components);
    }
    const observerDataLength = deserializeObservations(packet, mode);
    const soaData = packet.slice(observerDataLength);
    return deserializeData(soaData, mode);
  };
}
var DESERIALIZE_MODE = /* @__PURE__ */ ((DESERIALIZE_MODE2) => {
  DESERIALIZE_MODE2[DESERIALIZE_MODE2["REPLACE"] = 0] = "REPLACE";
  DESERIALIZE_MODE2[DESERIALIZE_MODE2["APPEND"] = 1] = "APPEND";
  DESERIALIZE_MODE2[DESERIALIZE_MODE2["MAP"] = 2] = "MAP";
  return DESERIALIZE_MODE2;
})(DESERIALIZE_MODE || {});

// ../../src/legacy/index.ts
var $modifier = Symbol("$modifier");
function modifier(c, mod) {
  const inner = () => [c, mod];
  inner[$modifier] = true;
  return inner;
}
var Not2 = (c) => modifier(c, "not");
var Or2 = (c) => modifier(c, "or");
var Changed = (c) => modifier(c, "changed");
function defineQuery(components) {
  const queryFn = (world) => query(world, components);
  queryFn.components = components;
  return queryFn;
}
function enterQuery(queryFn) {
  let queue = [];
  const initSet = /* @__PURE__ */ new WeakSet();
  return (world) => {
    if (!initSet.has(world)) {
      observe(world, onAdd(...queryFn.components), (eid) => queue.push(eid));
      initSet.add(world);
    }
    const results = queue.slice();
    queue.length = 0;
    return results;
  };
}
function exitQuery(queryFn) {
  let queue = [];
  const initSet = /* @__PURE__ */ new WeakSet();
  return (world) => {
    if (!initSet.has(world)) {
      observe(world, onRemove(...queryFn.components), (eid) => queue.push(eid));
      initSet.add(world);
    }
    const results = queue.slice();
    queue.length = 0;
    return results;
  };
}
var addComponent3 = (world, component, eid) => addComponent(world, eid, component);
var hasComponent2 = (world, component, eid) => hasComponent(world, eid, component);
var removeComponent3 = (world, component, eid) => removeComponent(world, eid, component);
var Types = {
  i8: "i8",
  ui8: "ui8",
  ui8c: "ui8c",
  i16: "i16",
  ui16: "ui16",
  i32: "i32",
  ui32: "ui32",
  f32: "f32",
  f64: "f64",
  eid: "eid"
};
var arrayByTypeMap = {
  "i8": Int8Array,
  "ui8": Uint8Array,
  "ui8c": Uint8ClampedArray,
  "i16": Int16Array,
  "ui16": Uint16Array,
  "i32": Int32Array,
  "ui32": Uint32Array,
  "f32": Float32Array,
  "f64": Float64Array,
  "eid": Uint32Array
};
var defineComponent = (schema, max = 1e5) => {
  const createSoA = (schema2, max2) => {
    const component = {};
    for (const key in schema2) {
      if (Array.isArray(schema2[key])) {
        const [type, length] = schema2[key];
        component[key] = Array.from({ length }, () => new arrayByTypeMap[type](max2));
      } else if (typeof schema2[key] === "object") {
        component[key] = createSoA(schema2[key], max2);
      } else {
        const type = schema2[key];
        const TypeConstructor = arrayByTypeMap[type];
        if (TypeConstructor) {
          component[key] = new TypeConstructor(max2);
        } else {
          throw new Error(`Unsupported type: ${schema2[key]}`);
        }
      }
    }
    return component;
  };
  return createSoA(schema, max);
};
export {
  $modifier,
  Changed,
  DESERIALIZE_MODE,
  Not2 as Not,
  Or2 as Or,
  Types,
  addComponent3 as addComponent,
  defineComponent,
  defineDeserializer,
  defineQuery,
  defineSerializer,
  enterQuery,
  exitQuery,
  hasComponent2 as hasComponent,
  removeComponent3 as removeComponent
};
//# sourceMappingURL=index.mjs.map
