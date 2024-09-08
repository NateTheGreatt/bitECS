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

// src/core/utils/defineHiddenProperty.ts
var defineHiddenProperty = (obj, key, value) => Object.defineProperty(obj, key, {
  value,
  enumerable: false,
  writable: true,
  configurable: true
});

// src/core/EntityIndex.ts
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
function queryCheckEntity(world, query4, eid) {
  const ctx = world[$internal];
  const { masks, notMasks, orMasks, generations } = query4;
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
var queryAddEntity = (query4, eid) => {
  query4.toRemove.remove(eid);
  query4.addObservable.notify(eid);
  query4.add(eid);
};
var queryRemoveEntity = (world, query4, eid) => {
  const ctx = world[$internal];
  const has = query4.has(eid);
  if (!has || query4.toRemove.has(eid)) return;
  query4.toRemove.add(eid);
  ctx.dirtyQueries.add(query4);
  query4.removeObservable.notify(eid);
};

// src/legacy/index.ts
import { observe as observe2, onAdd as onAdd2, onRemove as onRemove2, query as query2 } from "../core";
import {
  addComponent as ecsAddComponent,
  hasComponent as ecsHasComponent,
  removeComponent as ecsRemoveComponent
} from "../core";

// src/serialization/ObserverSerializer.ts
import {
  addComponent,
  removeComponent,
  addEntity,
  removeEntity,
  observe,
  onAdd,
  onRemove
} from "../core";
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
var createObserverDeserializer = (world, networkedTag, components) => {
  return (packet, entityIdMapping = /* @__PURE__ */ new Map()) => {
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

// src/legacy/serialization.ts
import { query } from "../core";

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
var withOnTargetRemoved = (onRemove4) => (relation) => {
  const ctx = relation[$relationData];
  ctx.onTargetRemoved = onRemove4;
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
  addComponent3(world, baseEid, IsA(inheritedEid));
  const components = getEntityComponents(world, inheritedEid);
  for (const component of components) {
    if (component === Prefab) {
      continue;
    }
    addComponent3(world, baseEid, component);
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
var addComponent3 = (world, eid, ...components) => {
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
      addComponent3(world, eid, Pair(relation, Wildcard));
      const target = component[$pairTarget];
      addComponent3(world, eid, Pair(Wildcard, target));
      const relationData = relation[$relationData];
      if (relationData.exclusiveRelation === true && target !== Wildcard) {
        const oldTarget = getRelationTargets(world, eid, relation)[0];
        if (oldTarget !== void 0 && oldTarget !== null && oldTarget !== target) {
          removeComponent3(world, eid, relation(oldTarget));
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
var removeComponent3 = (world, eid, ...components) => {
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
      removeComponent3(world, eid, Pair(Wildcard, target));
      const relation = component[$relation];
      const otherTargets = getRelationTargets(world, eid, relation);
      if (otherTargets.length === 0) {
        removeComponent3(world, eid, Pair(relation, Wildcard));
      }
    }
  });
};

// src/serialization/SnapshotSerializer.ts
import {
  getAllEntities as getAllEntities2,
  addEntity as addEntity3
} from "../core";
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
    const entities = getAllEntities2(world);
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
      const worldEntityId = addEntity3(world);
      entityIdMap.set(packetEntityId, worldEntityId);
      const componentCount = dataView.getUint8(offset);
      offset += 1;
      for (let i = 0; i < componentCount; i++) {
        const componentIndex = dataView.getUint8(offset);
        offset += 1;
        addComponent3(world, worldEntityId, components[componentIndex]);
      }
    }
    soaDeserializer(packet.slice(offset), entityIdMap);
    return entityIdMap;
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
