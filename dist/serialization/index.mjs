// src/serialization/SoASerializer.ts
var $u8 = Symbol.for("bitecs-u8");
var $i8 = Symbol.for("bitecs-i8");
var $u16 = Symbol.for("bitecs-u16");
var $i16 = Symbol.for("bitecs-i16");
var $u32 = Symbol.for("bitecs-u32");
var $i32 = Symbol.for("bitecs-i32");
var $f32 = Symbol.for("bitecs-f32");
var $f64 = Symbol.for("bitecs-f64");
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

// src/core/utils/defineHiddenProperty.ts
var defineHiddenProperty = (obj, key, value) => Object.defineProperty(obj, key, {
  value,
  enumerable: false,
  writable: true,
  configurable: true
});

// src/core/EntityIndex.ts
var getId = (index, id) => id & index.entityMask;
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
var isEntityIdAlive = (index, id) => {
  const entityId = getId(index, id);
  const denseIndex = index.sparse[entityId];
  return denseIndex !== void 0 && denseIndex < index.aliveCount && index.dense[denseIndex] === id;
};

// src/core/World.ts
var $internal = Symbol.for("bitecs_internal");
var getAllEntities = (world) => world[$internal].entityIndex.dense.slice(0);

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
var $opType = Symbol.for("bitecs-opType");
var $opTerms = Symbol.for("bitecs-opTerms");
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
var getEntityComponents = (world, eid) => {
  const ctx = world[$internal];
  if (eid === void 0) throw new Error(`getEntityComponents: entity id is undefined.`);
  if (!isEntityIdAlive(ctx.entityIndex, eid))
    throw new Error(`getEntityComponents: entity ${eid} does not exist in the world.`);
  return Array.from(ctx.entityComponents.get(eid));
};
var entityExists = (world, eid) => isEntityIdAlive(world[$internal].entityIndex, eid);

// src/serialization/SnapshotSerializer.ts
function serializeRelationData(data, eid, dataView, offset) {
  if (!data) return offset;
  if (Array.isArray(data)) {
    const value = data[eid];
    if (value !== void 0) {
      dataView.setFloat64(offset, value);
      return offset + 8;
    }
    return offset;
  }
  if (typeof data === "object") {
    const keys = Object.keys(data).sort();
    for (const key of keys) {
      const arr = data[key];
      const value = arr[eid];
      if (value !== void 0) {
        if (arr instanceof Int8Array || $i8 in arr) {
          dataView.setInt8(offset, value);
          offset += 1;
        } else if (arr instanceof Uint8Array || $u8 in arr) {
          dataView.setUint8(offset, value);
          offset += 1;
        } else if (arr instanceof Int16Array || $i16 in arr) {
          dataView.setInt16(offset, value);
          offset += 2;
        } else if (arr instanceof Uint16Array || $u16 in arr) {
          dataView.setUint16(offset, value);
          offset += 2;
        } else if (arr instanceof Int32Array || $i32 in arr) {
          dataView.setInt32(offset, value);
          offset += 4;
        } else if (arr instanceof Uint32Array || $u32 in arr) {
          dataView.setUint32(offset, value);
          offset += 4;
        } else if (arr instanceof Float32Array || $f32 in arr) {
          dataView.setFloat32(offset, value);
          offset += 4;
        } else {
          dataView.setFloat64(offset, value);
          offset += 8;
        }
      }
    }
  }
  return offset;
}
function deserializeRelationData(data, eid, dataView, offset) {
  if (!data) return offset;
  if (Array.isArray(data)) {
    data[eid] = dataView.getFloat64(offset);
    return offset + 8;
  }
  if (typeof data === "object") {
    const keys = Object.keys(data).sort();
    for (const key of keys) {
      const arr = data[key];
      if (arr instanceof Int8Array || $i8 in arr) {
        arr[eid] = dataView.getInt8(offset);
        offset += 1;
      } else if (arr instanceof Uint8Array || $u8 in arr) {
        arr[eid] = dataView.getUint8(offset);
        offset += 1;
      } else if (arr instanceof Int16Array || $i16 in arr) {
        arr[eid] = dataView.getInt16(offset);
        offset += 2;
      } else if (arr instanceof Uint16Array || $u16 in arr) {
        arr[eid] = dataView.getUint16(offset);
        offset += 2;
      } else if (arr instanceof Int32Array || $i32 in arr) {
        arr[eid] = dataView.getInt32(offset);
        offset += 4;
      } else if (arr instanceof Uint32Array || $u32 in arr) {
        arr[eid] = dataView.getUint32(offset);
        offset += 4;
      } else if (arr instanceof Float32Array || $f32 in arr) {
        arr[eid] = dataView.getFloat32(offset);
        offset += 4;
      } else {
        arr[eid] = dataView.getFloat64(offset);
        offset += 8;
      }
    }
  }
  return offset;
}
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
        const component = components[j];
        if (isRelation(component)) {
          const targets = getRelationTargets(world, entityId, component);
          for (const target of targets) {
            dataView.setUint8(offset, j);
            offset += 1;
            dataView.setUint32(offset, target);
            offset += 4;
            const relationData = component(target);
            offset = serializeRelationData(relationData, entityId, dataView, offset);
            componentCount++;
          }
        } else if (hasComponent(world, entityId, component)) {
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
    const entities = getAllEntities(world);
    serializeEntityComponentRelationships(entities);
    serializeComponentData(entities);
    return buffer.slice(0, offset);
  };
};
var createSnapshotDeserializer = (world, components, constructorMapping) => {
  let entityIdMapping = constructorMapping || /* @__PURE__ */ new Map();
  const soaDeserializer = createSoADeserializer(components);
  return (packet, overrideMapping) => {
    const currentMapping = overrideMapping || entityIdMapping;
    const dataView = new DataView(packet);
    let offset = 0;
    const entityCount = dataView.getUint32(offset);
    offset += 4;
    for (let entityIndex = 0; entityIndex < entityCount; entityIndex++) {
      const packetEntityId = dataView.getUint32(offset);
      offset += 4;
      let worldEntityId = currentMapping.get(packetEntityId);
      if (worldEntityId === void 0) {
        worldEntityId = addEntity(world);
        currentMapping.set(packetEntityId, worldEntityId);
      }
      const componentCount = dataView.getUint8(offset);
      offset += 1;
      for (let i = 0; i < componentCount; i++) {
        const componentIndex = dataView.getUint8(offset);
        offset += 1;
        const component = components[componentIndex];
        if (isRelation(component)) {
          const targetId = dataView.getUint32(offset);
          offset += 4;
          let worldTargetId = currentMapping.get(targetId);
          if (worldTargetId === void 0) {
            worldTargetId = addEntity(world);
            currentMapping.set(targetId, worldTargetId);
          }
          const relationComponent = component(worldTargetId);
          addComponent(world, worldEntityId, relationComponent);
          offset = deserializeRelationData(relationComponent, worldEntityId, dataView, offset);
        } else {
          addComponent(world, worldEntityId, component);
        }
      }
    }
    soaDeserializer(packet.slice(offset), currentMapping);
    return currentMapping;
  };
};

// src/serialization/ObserverSerializer.ts
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
function serializeRelationData2(data, eid, dataView, offset) {
  if (!data) return offset;
  if (Array.isArray(data)) {
    const value = data[eid];
    if (value !== void 0) {
      dataView.setFloat64(offset, value);
      return offset + 8;
    }
    return offset;
  }
  if (typeof data === "object") {
    const keys = Object.keys(data).sort();
    for (const key of keys) {
      const arr = data[key];
      const value = arr[eid];
      if (value !== void 0) {
        if (arr instanceof Int8Array || $i8 in arr) {
          dataView.setInt8(offset, value);
          offset += 1;
        } else if (arr instanceof Uint8Array || $u8 in arr) {
          dataView.setUint8(offset, value);
          offset += 1;
        } else if (arr instanceof Int16Array || $i16 in arr) {
          dataView.setInt16(offset, value);
          offset += 2;
        } else if (arr instanceof Uint16Array || $u16 in arr) {
          dataView.setUint16(offset, value);
          offset += 2;
        } else if (arr instanceof Int32Array || $i32 in arr) {
          dataView.setInt32(offset, value);
          offset += 4;
        } else if (arr instanceof Uint32Array || $u32 in arr) {
          dataView.setUint32(offset, value);
          offset += 4;
        } else if (arr instanceof Float32Array || $f32 in arr) {
          dataView.setFloat32(offset, value);
          offset += 4;
        } else {
          dataView.setFloat64(offset, value);
          offset += 8;
        }
      }
    }
  }
  return offset;
}
function deserializeRelationData2(data, eid, dataView, offset) {
  if (!data) return offset;
  if (Array.isArray(data)) {
    data[eid] = dataView.getFloat64(offset);
    return offset + 8;
  }
  if (typeof data === "object") {
    const keys = Object.keys(data).sort();
    for (const key of keys) {
      const arr = data[key];
      if (arr instanceof Int8Array || $i8 in arr) {
        arr[eid] = dataView.getInt8(offset);
        offset += 1;
      } else if (arr instanceof Uint8Array || $u8 in arr) {
        arr[eid] = dataView.getUint8(offset);
        offset += 1;
      } else if (arr instanceof Int16Array || $i16 in arr) {
        arr[eid] = dataView.getInt16(offset);
        offset += 2;
      } else if (arr instanceof Uint16Array || $u16 in arr) {
        arr[eid] = dataView.getUint16(offset);
        offset += 2;
      } else if (arr instanceof Int32Array || $i32 in arr) {
        arr[eid] = dataView.getInt32(offset);
        offset += 4;
      } else if (arr instanceof Uint32Array || $u32 in arr) {
        arr[eid] = dataView.getUint32(offset);
        offset += 4;
      } else if (arr instanceof Float32Array || $f32 in arr) {
        arr[eid] = dataView.getFloat32(offset);
        offset += 4;
      } else {
        arr[eid] = dataView.getFloat64(offset);
        offset += 8;
      }
    }
  }
  return offset;
}
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
          const relationData = component(target);
          queue.push([eid, 4 /* AddRelation */, i, target, relationData]);
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
      const [entityId, type, componentId, targetId, relationData] = queue[i];
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
          if (type === 4 /* AddRelation */ && relationData) {
            offset = serializeRelationData2(relationData, entityId, dataView, offset);
          }
        }
      }
    }
    queue.length = 0;
    return buffer.slice(0, offset);
  };
};
var createObserverDeserializer = (world, networkedTag, components, constructorMapping) => {
  let entityIdMapping = constructorMapping || /* @__PURE__ */ new Map();
  return (packet, overrideMapping) => {
    const currentMapping = overrideMapping || entityIdMapping;
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
      let worldEntityId = currentMapping.get(packetEntityId);
      if (operationType === 0 /* AddEntity */) {
        if (worldEntityId === void 0) {
          worldEntityId = addEntity2(world);
          currentMapping.set(packetEntityId, worldEntityId);
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
          const worldTargetId = currentMapping.get(targetId);
          if (worldTargetId !== void 0) {
            const relationComponent = component(worldTargetId);
            addComponent2(world, worldEntityId, relationComponent);
            offset = deserializeRelationData2(relationComponent, worldEntityId, dataView, offset);
          }
        } else if (operationType === 5 /* RemoveRelation */) {
          const worldTargetId = currentMapping.get(targetId);
          if (worldTargetId !== void 0) {
            removeComponent2(world, worldEntityId, component(worldTargetId));
          }
        }
      }
    }
    return currentMapping;
  };
};
export {
  createObserverDeserializer,
  createObserverSerializer,
  createSnapshotDeserializer,
  createSnapshotSerializer,
  createSoADeserializer,
  createSoASerializer,
  f32,
  f64,
  i16,
  i32,
  i8,
  u16,
  u32,
  u8
};
//# sourceMappingURL=index.mjs.map
