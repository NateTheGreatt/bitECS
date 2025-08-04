// src/serialization/SoASerializer.ts
var $u8 = Symbol.for("bitecs-u8");
var $i8 = Symbol.for("bitecs-i8");
var $u16 = Symbol.for("bitecs-u16");
var $i16 = Symbol.for("bitecs-i16");
var $u32 = Symbol.for("bitecs-u32");
var $i32 = Symbol.for("bitecs-i32");
var $f32 = Symbol.for("bitecs-f32");
var $f64 = Symbol.for("bitecs-f64");
var $arr = Symbol.for("bitecs-arr");
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
var array = (type = $f32) => {
  const arr = [];
  Object.defineProperty(arr, $arr, { value: type, enumerable: false, writable: false, configurable: false });
  return arr;
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
function isArrayType(value) {
  return Array.isArray(value) && $arr in value;
}
function getArrayElementType(arrayType) {
  return arrayType[$arr];
}
function serializeArrayValue(elementType, value, view, offset) {
  let bytesWritten = 0;
  const isArrayDefined = Array.isArray(value) ? 1 : 0;
  bytesWritten += typeSetters[$u8](view, offset, isArrayDefined);
  if (!isArrayDefined) {
    return bytesWritten;
  }
  bytesWritten += typeSetters[$u32](view, offset + bytesWritten, value.length);
  for (let i = 0; i < value.length; i++) {
    const element = value[i];
    if (isArrayType(elementType)) {
      bytesWritten += serializeArrayValue(getArrayElementType(elementType), element, view, offset + bytesWritten);
    } else if (typeof elementType === "symbol") {
      bytesWritten += typeSetters[elementType](view, offset + bytesWritten, element);
    }
  }
  return bytesWritten;
}
function deserializeArrayValue(elementType, view, offset) {
  let bytesRead = 0;
  const isArrayResult = typeGetters[$u8](view, offset + bytesRead);
  bytesRead += isArrayResult.size;
  if (!isArrayResult.value) {
    return { size: bytesRead };
  }
  const arrayLengthResult = typeGetters[$u32](view, offset + bytesRead);
  bytesRead += arrayLengthResult.size;
  const arr = new Array(arrayLengthResult.value);
  for (let i = 0; i < arr.length; i++) {
    if (isArrayType(elementType)) {
      const { value, size } = deserializeArrayValue(getArrayElementType(elementType), view, offset + bytesRead);
      bytesRead += size;
      if (Array.isArray(value)) {
        arr[i] = value;
      }
    } else {
      const { value, size } = typeGetters[elementType](view, offset + bytesRead);
      bytesRead += size;
      arr[i] = value;
    }
  }
  return { value: arr, size: bytesRead };
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
      const componentProperty = component[props[i]];
      if (isArrayType(componentProperty)) {
        bytesWritten += serializeArrayValue(getArrayElementType(componentProperty), componentProperty[index], view, offset + bytesWritten);
      } else {
        bytesWritten += setters[i](view, offset + bytesWritten, componentProperty[index]);
      }
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
      const componentProperty = component[props[i]];
      if (isArrayType(componentProperty)) {
        const { value, size } = deserializeArrayValue(getArrayElementType(componentProperty), view, offset + bytesRead);
        if (Array.isArray(value)) {
          componentProperty[index] = value;
        }
        bytesRead += size;
      } else {
        const { value, size } = getters[i](view, offset + bytesRead);
        component[props[i]][index] = value;
        bytesRead += size;
      }
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

// src/serialization/SnapshotSerializer.ts
import {
  addComponent,
  hasComponent,
  getAllEntities,
  addEntity,
  isRelation,
  getRelationTargets,
  Wildcard
} from "bitecs";
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
  removeComponent,
  addEntity as addEntity2,
  removeEntity,
  observe,
  onAdd,
  onRemove,
  entityExists,
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
  observe(world, onAdd(networkedTag), (eid) => {
    queue.push([eid, 0 /* AddEntity */, -1]);
  });
  observe(world, onRemove(networkedTag), (eid) => {
    queue.push([eid, 1 /* RemoveEntity */, -1]);
    relationTargets.delete(eid);
  });
  components.forEach((component, i) => {
    if (isRelation2(component)) {
      observe(world, onAdd(networkedTag, component(Wildcard2)), (eid) => {
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
      observe(world, onRemove(networkedTag, component(Wildcard2)), (eid) => {
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
      observe(world, onAdd(networkedTag, component), (eid) => {
        queue.push([eid, 2 /* AddComponent */, i]);
      });
      observe(world, onRemove(networkedTag, component), (eid) => {
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
          console.warn(`Attempted to deserialize addEntity with ID ${packetEntityId}, but it has already been deserialzied and exists in the mapping.`);
        }
      } else if (worldEntityId !== void 0 && entityExists(world, worldEntityId)) {
        if (operationType === 1 /* RemoveEntity */) {
          removeEntity(world, worldEntityId);
          currentMapping.delete(packetEntityId);
        } else if (operationType === 2 /* AddComponent */) {
          addComponent2(world, worldEntityId, component);
        } else if (operationType === 3 /* RemoveComponent */) {
          removeComponent(world, worldEntityId, component);
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
            removeComponent(world, worldEntityId, component(worldTargetId));
          }
        }
      }
    }
    return currentMapping;
  };
};
export {
  $f32,
  $f64,
  $i16,
  $i32,
  $i8,
  $u16,
  $u32,
  $u8,
  array,
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
