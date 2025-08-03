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

// src/legacy/index.ts
var legacy_exports = {};
__export(legacy_exports, {
  $modifier: () => $modifier,
  Changed: () => Changed,
  DESERIALIZE_MODE: () => DESERIALIZE_MODE,
  Not: () => Not,
  Or: () => Or,
  Types: () => Types,
  addComponent: () => addComponent2,
  defineComponent: () => defineComponent,
  defineDeserializer: () => defineDeserializer,
  defineQuery: () => defineQuery,
  defineSerializer: () => defineSerializer,
  enterQuery: () => enterQuery,
  exitQuery: () => exitQuery,
  hasComponent: () => hasComponent,
  removeComponent: () => removeComponent2
});
module.exports = __toCommonJS(legacy_exports);
var import_bitecs2 = require("bitecs");

// src/serialization/ObserverSerializer.ts
var import_bitecs = require("bitecs");

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
function isTypedArrayOrBranded(arr) {
  return arr && (ArrayBuffer.isView(arr) || Array.isArray(arr) && typeof arr === "object");
}
function getTypeForArray(arr) {
  for (const symbol of [$u8, $i8, $u16, $i16, $u32, $i32, $f32, $f64]) {
    if (symbol in arr) return symbol;
  }
  if (arr instanceof Int8Array) return $i8;
  if (arr instanceof Uint8Array) return $u8;
  if (arr instanceof Int16Array) return $i16;
  if (arr instanceof Uint16Array) return $u16;
  if (arr instanceof Int32Array) return $i32;
  if (arr instanceof Uint32Array) return $u32;
  if (arr instanceof Float32Array) return $f32;
  return $f64;
}
var createComponentSerializer = (component) => {
  if (isTypedArrayOrBranded(component)) {
    const type = getTypeForArray(component);
    const setter = typeSetters[type];
    return (view, offset, index) => {
      let bytesWritten = 0;
      bytesWritten += typeSetters[$u32](view, offset, index);
      bytesWritten += setter(view, offset + bytesWritten, component[index]);
      return bytesWritten;
    };
  }
  const props = Object.keys(component);
  const types = props.map((prop) => {
    const arr = component[prop];
    if (!isTypedArrayOrBranded(arr)) {
      throw new Error(`Invalid array type for property ${prop}`);
    }
    return getTypeForArray(arr);
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
  if (isTypedArrayOrBranded(component)) {
    const type = getTypeForArray(component);
    const getter = typeGetters[type];
    return (view, offset, entityIdMapping) => {
      let bytesRead = 0;
      const { value: originalIndex, size: indexSize } = typeGetters[$u32](view, offset);
      bytesRead += indexSize;
      const index = entityIdMapping ? entityIdMapping.get(originalIndex) ?? originalIndex : originalIndex;
      const { value, size } = getter(view, offset + bytesRead);
      component[index] = value;
      return bytesRead + size;
    };
  }
  const props = Object.keys(component);
  const types = props.map((prop) => {
    const arr = component[prop];
    if (!isTypedArrayOrBranded(arr)) {
      throw new Error(`Invalid array type for property ${prop}`);
    }
    return getTypeForArray(arr);
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

// src/serialization/ObserverSerializer.ts
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
var createObserverSerializer = (world, networkedTag, components, buffer = new ArrayBuffer(1024 * 1024 * 100)) => {
  const dataView = new DataView(buffer);
  let offset = 0;
  const queue = [];
  const relationTargets = /* @__PURE__ */ new Map();
  (0, import_bitecs.observe)(world, (0, import_bitecs.onAdd)(networkedTag), (eid) => {
    queue.push([eid, 0 /* AddEntity */, -1]);
  });
  (0, import_bitecs.observe)(world, (0, import_bitecs.onRemove)(networkedTag), (eid) => {
    queue.push([eid, 1 /* RemoveEntity */, -1]);
    relationTargets.delete(eid);
  });
  components.forEach((component, i) => {
    if ((0, import_bitecs.isRelation)(component)) {
      (0, import_bitecs.observe)(world, (0, import_bitecs.onAdd)(networkedTag, component(import_bitecs.Wildcard)), (eid) => {
        const targets = (0, import_bitecs.getRelationTargets)(world, eid, component);
        for (const target of targets) {
          if (!relationTargets.has(eid)) {
            relationTargets.set(eid, /* @__PURE__ */ new Map());
          }
          relationTargets.get(eid).set(i, target);
          const relationData = component(target);
          queue.push([eid, 4 /* AddRelation */, i, target, relationData]);
        }
      });
      (0, import_bitecs.observe)(world, (0, import_bitecs.onRemove)(networkedTag, component(import_bitecs.Wildcard)), (eid) => {
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
      (0, import_bitecs.observe)(world, (0, import_bitecs.onAdd)(networkedTag, component), (eid) => {
        queue.push([eid, 2 /* AddComponent */, i]);
      });
      (0, import_bitecs.observe)(world, (0, import_bitecs.onRemove)(networkedTag, component), (eid) => {
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
            offset = serializeRelationData(relationData, entityId, dataView, offset);
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
          worldEntityId = (0, import_bitecs.addEntity)(world);
          currentMapping.set(packetEntityId, worldEntityId);
          (0, import_bitecs.addComponent)(world, worldEntityId, networkedTag);
        } else {
          console.warn(`Attempted to deserialize addEntity with ID ${packetEntityId}, but it has already been deserialzied and exists in the mapping.`);
        }
      } else if (worldEntityId !== void 0 && (0, import_bitecs.entityExists)(world, worldEntityId)) {
        if (operationType === 1 /* RemoveEntity */) {
          (0, import_bitecs.removeEntity)(world, worldEntityId);
          currentMapping.delete(packetEntityId);
        } else if (operationType === 2 /* AddComponent */) {
          (0, import_bitecs.addComponent)(world, worldEntityId, component);
        } else if (operationType === 3 /* RemoveComponent */) {
          (0, import_bitecs.removeComponent)(world, worldEntityId, component);
        } else if (operationType === 4 /* AddRelation */) {
          const worldTargetId = currentMapping.get(targetId);
          if (worldTargetId !== void 0) {
            const relationComponent = component(worldTargetId);
            (0, import_bitecs.addComponent)(world, worldEntityId, relationComponent);
            offset = deserializeRelationData(relationComponent, worldEntityId, dataView, offset);
          }
        } else if (operationType === 5 /* RemoveRelation */) {
          const worldTargetId = currentMapping.get(targetId);
          if (worldTargetId !== void 0) {
            (0, import_bitecs.removeComponent)(world, worldEntityId, component(worldTargetId));
          }
        }
      }
    }
    return currentMapping;
  };
};

// src/legacy/serialization.ts
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

// src/legacy/index.ts
var $modifier = Symbol("$modifier");
function modifier(c, mod) {
  const inner = () => [c, mod];
  inner[$modifier] = true;
  return inner;
}
var Not = (c) => modifier(c, "not");
var Or = (c) => modifier(c, "or");
var Changed = (c) => modifier(c, "changed");
function defineQuery(components) {
  const queryFn = (world) => (0, import_bitecs2.query)(world, components);
  queryFn.components = components;
  return queryFn;
}
function enterQuery(queryFn) {
  let queue = [];
  const initSet = /* @__PURE__ */ new WeakSet();
  return (world) => {
    if (!initSet.has(world)) {
      (0, import_bitecs2.observe)(world, (0, import_bitecs2.onAdd)(...queryFn.components), (eid) => queue.push(eid));
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
      (0, import_bitecs2.observe)(world, (0, import_bitecs2.onRemove)(...queryFn.components), (eid) => queue.push(eid));
      initSet.add(world);
    }
    const results = queue.slice();
    queue.length = 0;
    return results;
  };
}
var addComponent2 = (world, component, eid) => (0, import_bitecs2.addComponent)(world, eid, component);
var hasComponent = (world, component, eid) => (0, import_bitecs2.hasComponent)(world, eid, component);
var removeComponent2 = (world, component, eid) => (0, import_bitecs2.removeComponent)(world, eid, component);
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
//# sourceMappingURL=index.cjs.map
