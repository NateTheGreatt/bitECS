// src/serialization/SoASerializer.ts
var $u8 = Symbol.for("bitecs-u8");
var $i8 = Symbol.for("bitecs-i8");
var $u16 = Symbol.for("bitecs-u16");
var $i16 = Symbol.for("bitecs-i16");
var $u32 = Symbol.for("bitecs-u32");
var $i32 = Symbol.for("bitecs-i32");
var $f32 = Symbol.for("bitecs-f32");
var $f64 = Symbol.for("bitecs-f64");
var $str = Symbol.for("bitecs-str");
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
var str = typeTagForSerialization($str);
var functionToSymbolMap = /* @__PURE__ */ new Map([
  [u8, $u8],
  [i8, $i8],
  [u16, $u16],
  [i16, $i16],
  [u32, $u32],
  [i32, $i32],
  [f32, $f32],
  [f64, $f64],
  [str, $str]
]);
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
  },
  [$str]: (view, offset, value) => {
    const enc = textEncoder;
    const bytes = enc.encode(value);
    let written = 0;
    written += typeSetters[$u32](view, offset + written, bytes.length);
    new Uint8Array(view.buffer, view.byteOffset + offset + written, bytes.length).set(bytes);
    written += bytes.length;
    return written;
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
  [$f64]: (view, offset) => ({ value: view.getFloat64(offset), size: 8 }),
  [$str]: (view, offset) => {
    const { value: len, size: lenSize } = typeGetters[$u32](view, offset);
    const bytes = new Uint8Array(view.buffer, view.byteOffset + offset + lenSize, len);
    const dec = textDecoder;
    const strValue = dec.decode(bytes);
    return { value: strValue, size: lenSize + len };
  }
};
function resolveTypeToSymbol(type) {
  if (typeof type === "symbol") {
    return type;
  }
  if (typeof type === "function") {
    const symbol = functionToSymbolMap.get(type);
    if (symbol) return symbol;
    throw new Error(`Unknown type function: ${type}`);
  }
  if (isArrayType(type)) {
    return resolveTypeToSymbol(type[$arr]);
  }
  return $f32;
}
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();
var array = (type = f32) => {
  const arr = [];
  Object.defineProperty(arr, $arr, { value: type, enumerable: false, writable: false, configurable: false });
  return arr;
};
function isTypedArrayOrBranded(arr) {
  return arr && (ArrayBuffer.isView(arr) || Array.isArray(arr) && typeof arr === "object");
}
function getTypeForArray(arr) {
  if (isArrayType(arr)) {
    return resolveTypeToSymbol(arr[$arr]);
  }
  for (const symbol of [$u8, $i8, $u16, $i16, $u32, $i32, $f32, $f64, $str]) {
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
    } else {
      const symbol = resolveTypeToSymbol(elementType);
      bytesWritten += typeSetters[symbol](view, offset + bytesWritten, element);
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
      const symbol = resolveTypeToSymbol(elementType);
      const { value, size } = typeGetters[symbol](view, offset + bytesRead);
      bytesRead += size;
      arr[i] = value;
    }
  }
  return { value: arr, size: bytesRead };
}
var isFloatType = (array2) => {
  const arrayType = getTypeForArray(array2);
  return arrayType === $f32 || arrayType === $f64;
};
var getEpsilonForType = (array2, epsilon) => isFloatType(array2) ? epsilon : 0;
var getShadow = (shadowMap, array2) => {
  let shadow = shadowMap.get(array2);
  if (!shadow) {
    if (ArrayBuffer.isView(array2)) {
      shadow = new array2.constructor(array2.length);
    } else {
      shadow = new Array(array2.length).fill(0);
    }
    shadowMap.set(array2, shadow);
  }
  return shadow;
};
var hasChanged = (shadowMap, array2, index, epsilon = 1e-4) => {
  const shadow = getShadow(shadowMap, array2);
  const currentValue = array2[index];
  const actualEpsilon = getEpsilonForType(array2, epsilon);
  const changed = actualEpsilon > 0 ? Math.abs(shadow[index] - currentValue) > actualEpsilon : shadow[index] !== currentValue;
  shadow[index] = currentValue;
  return changed;
};
var createComponentSerializer = (component, diff = false, shadowMap, epsilon = 1e-4) => {
  if (isTypedArrayOrBranded(component)) {
    const type = getTypeForArray(component);
    const setter = typeSetters[type];
    return (view, offset, index, componentId) => {
      if (diff && shadowMap) {
        if (!hasChanged(shadowMap, component, index, epsilon)) return 0;
        let bytesWritten = 0;
        bytesWritten += typeSetters[$u32](view, offset + bytesWritten, index);
        bytesWritten += typeSetters[$u32](view, offset + bytesWritten, componentId);
        bytesWritten += setter(view, offset + bytesWritten, component[index]);
        return bytesWritten;
      } else {
        let bytesWritten = 0;
        bytesWritten += typeSetters[$u32](view, offset + bytesWritten, index);
        bytesWritten += setter(view, offset + bytesWritten, component[index]);
        return bytesWritten;
      }
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
  return (view, offset, index, componentId) => {
    if (diff && shadowMap) {
      let changeMask = 0;
      for (let i = 0; i < props.length; i++) {
        const componentProperty = component[props[i]];
        if (hasChanged(shadowMap, componentProperty, index, epsilon)) {
          changeMask |= 1 << i;
        }
      }
      if (changeMask === 0) return 0;
      let bytesWritten = 0;
      bytesWritten += typeSetters[$u32](view, offset + bytesWritten, index);
      bytesWritten += typeSetters[$u32](view, offset + bytesWritten, componentId);
      const maskSetter = props.length <= 8 ? typeSetters[$u8] : props.length <= 16 ? typeSetters[$u16] : typeSetters[$u32];
      bytesWritten += maskSetter(view, offset + bytesWritten, changeMask);
      for (let i = 0; i < props.length; i++) {
        if (changeMask & 1 << i) {
          const componentProperty = component[props[i]];
          if (isArrayType(componentProperty)) {
            bytesWritten += serializeArrayValue(getArrayElementType(componentProperty), componentProperty[index], view, offset + bytesWritten);
          } else {
            bytesWritten += setters[i](view, offset + bytesWritten, componentProperty[index]);
          }
        }
      }
      return bytesWritten;
    } else {
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
    }
  };
};
var createComponentDeserializer = (component, diff = false) => {
  if (isTypedArrayOrBranded(component)) {
    const type = getTypeForArray(component);
    const getter = typeGetters[type];
    return (view, offset, entityIdMapping) => {
      let bytesRead = 0;
      const { value: originalIndex, size: indexSize } = typeGetters[$u32](view, offset);
      bytesRead += indexSize;
      const index = entityIdMapping ? entityIdMapping.get(originalIndex) ?? originalIndex : originalIndex;
      if (diff) {
        const { size: cidSize } = typeGetters[$u32](view, offset + bytesRead);
        bytesRead += cidSize;
      }
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
    if (diff) {
      const { size: cidSize } = typeGetters[$u32](view, offset + bytesRead);
      bytesRead += cidSize;
      const maskGetter = props.length <= 8 ? typeGetters[$u8] : props.length <= 16 ? typeGetters[$u16] : typeGetters[$u32];
      const { value: changeMask, size: maskSize } = maskGetter(view, offset + bytesRead);
      bytesRead += maskSize;
      for (let i = 0; i < props.length; i++) {
        if (changeMask & 1 << i) {
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
      }
    } else {
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
    }
    return bytesRead;
  };
};
var createSoASerializer = (components, options = {}) => {
  const {
    diff = false,
    buffer = new ArrayBuffer(1024 * 1024 * 100),
    epsilon = 1e-4
  } = options;
  const view = new DataView(buffer);
  const shadowMap = diff ? /* @__PURE__ */ new Map() : void 0;
  const componentSerializers = components.map((component) => createComponentSerializer(component, diff, shadowMap, epsilon));
  return (indices) => {
    let offset = 0;
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      for (let j = 0; j < componentSerializers.length; j++) {
        offset += componentSerializers[j](view, offset, index, j);
      }
    }
    return buffer.slice(0, offset);
  };
};
var createSoADeserializer = (components, options = {}) => {
  const { diff = false } = options;
  const componentDeserializers = components.map((component) => createComponentDeserializer(component, diff));
  return (packet, entityIdMapping) => {
    const view = new DataView(packet);
    let offset = 0;
    while (offset < packet.byteLength) {
      if (diff) {
        const { value: originalEid, size: eidSize } = typeGetters[$u32](view, offset);
        const { value: componentId, size: cidSize } = typeGetters[$u32](view, offset + eidSize);
        offset += componentDeserializers[componentId](view, offset, entityIdMapping);
      } else {
        for (let i = 0; i < componentDeserializers.length; i++) {
          offset += componentDeserializers[i](view, offset, entityIdMapping);
        }
      }
    }
  };
};

// src/serialization/AoSSerializer.ts
var isFloatType2 = (array2) => {
  const arrayType = getTypeForArray(array2);
  return arrayType === $f32 || arrayType === $f64;
};
var getEpsilonForType2 = (array2, epsilon) => isFloatType2(array2) ? epsilon : 0;
var getShadowComponent = (shadowMap, component) => {
  let shadow = shadowMap.get(component);
  if (!shadow) {
    shadow = [];
    shadowMap.set(component, shadow);
  }
  return shadow;
};
var hasComponentChanged = (shadowMap, component, entityId, epsilon) => {
  const shadow = getShadowComponent(shadowMap, component);
  const currentValue = component[entityId];
  const shadowValue = shadow[entityId];
  if (currentValue === void 0) return false;
  if (shadowValue === void 0) return true;
  if (typeof currentValue === "object" && currentValue !== null) {
    const componentDef = component;
    for (const prop in currentValue) {
      if (componentDef[prop]) {
        const propEpsilon = getEpsilonForType2(componentDef[prop], epsilon);
        const changed = propEpsilon > 0 ? Math.abs(shadowValue[prop] - currentValue[prop]) > propEpsilon : shadowValue[prop] !== currentValue[prop];
        if (changed) return true;
      }
    }
    return false;
  } else {
    const valueEpsilon = getEpsilonForType2(component, epsilon);
    return valueEpsilon > 0 ? Math.abs(shadowValue - currentValue) > valueEpsilon : shadowValue !== currentValue;
  }
};
var updateShadow = (shadowMap, component, entityId) => {
  const shadow = getShadowComponent(shadowMap, component);
  const currentValue = component[entityId];
  if (typeof currentValue === "object" && currentValue !== null) {
    shadow[entityId] = { ...currentValue };
  } else {
    shadow[entityId] = currentValue;
  }
};
var createAoSComponentSerializer = (component, diff, shadowMap, epsilon = 1e-4) => {
  const isObjectComponent = typeof component === "object" && Object.keys(component).some((key) => isNaN(parseInt(key)) && typeof component[key] === "object");
  if (isObjectComponent) {
    const props = Object.keys(component).filter((key) => isNaN(parseInt(key)));
    const types = props.map((prop) => getTypeForArray(component[prop]));
    const setters = types.map((type) => typeSetters[type]);
    return (view, offset, entityId) => {
      const value = component[entityId];
      if (value === void 0) return 0;
      if (diff && shadowMap) {
        if (!hasComponentChanged(shadowMap, component, entityId, epsilon)) {
          return 0;
        }
        updateShadow(shadowMap, component, entityId);
      }
      let bytesWritten = 0;
      for (let i = 0; i < props.length; i++) {
        const prop = component[props[i]];
        const propValue = value[props[i]];
        if (isArrayType(prop)) {
          bytesWritten += serializeArrayValue(getArrayElementType(prop), propValue, view, offset + bytesWritten);
        } else {
          bytesWritten += setters[i](view, offset + bytesWritten, propValue);
        }
      }
      return bytesWritten;
    };
  } else {
    const type = getTypeForArray(component);
    const setter = typeSetters[type];
    return (view, offset, entityId) => {
      const value = component[entityId];
      if (value === void 0) return 0;
      if (diff && shadowMap) {
        if (!hasComponentChanged(shadowMap, component, entityId, epsilon)) {
          return 0;
        }
        updateShadow(shadowMap, component, entityId);
      }
      return setter(view, offset, value);
    };
  }
};
var createAoSComponentDeserializer = (component) => {
  const isObjectComponent = typeof component === "object" && Object.keys(component).some((key) => isNaN(parseInt(key)) && typeof component[key] === "object");
  if (isObjectComponent) {
    const props = Object.keys(component).filter((key) => isNaN(parseInt(key)));
    const types = props.map((prop) => getTypeForArray(component[prop]));
    const getters = types.map((type) => typeGetters[type]);
    return (view, offset, entityId) => {
      let bytesRead = 0;
      const value = {};
      for (let i = 0; i < props.length; i++) {
        const prop = component[props[i]];
        if (isArrayType(prop)) {
          const { value: propValue, size } = deserializeArrayValue(getArrayElementType(prop), view, offset + bytesRead);
          if (Array.isArray(propValue)) {
            value[props[i]] = propValue;
          }
          bytesRead += size;
        } else {
          const { value: propValue, size } = getters[i](view, offset + bytesRead);
          value[props[i]] = propValue;
          bytesRead += size;
        }
      }
      component[entityId] = value;
      return bytesRead;
    };
  } else {
    const type = getTypeForArray(component);
    const getter = typeGetters[type];
    return (view, offset, entityId) => {
      const { value, size } = getter(view, offset);
      component[entityId] = value;
      return size;
    };
  }
};
var createAoSSerializer = (components, options = {}) => {
  const {
    diff = false,
    buffer = new ArrayBuffer(1024 * 1024 * 100),
    epsilon = 1e-4
  } = options;
  const view = new DataView(buffer);
  const shadowMap = diff ? /* @__PURE__ */ new Map() : void 0;
  const componentSerializers = components.map(
    (component) => createAoSComponentSerializer(component, diff, shadowMap, epsilon)
  );
  return (entityIds) => {
    let offset = 0;
    for (let i = 0; i < entityIds.length; i++) {
      const entityId = entityIds[i];
      if (diff) {
        let entityHasChanges = false;
        for (let j = 0; j < components.length; j++) {
          if (shadowMap && hasComponentChanged(shadowMap, components[j], entityId, epsilon)) {
            entityHasChanges = true;
            break;
          }
        }
        if (!entityHasChanges) continue;
        offset += typeSetters[$u32](view, offset, entityId);
        const maskOffset = offset;
        const maskSetter = components.length <= 8 ? typeSetters[$u8] : components.length <= 16 ? typeSetters[$u16] : typeSetters[$u32];
        offset += maskSetter === typeSetters[$u8] ? 1 : maskSetter === typeSetters[$u16] ? 2 : 4;
        let componentMask = 0;
        for (let j = 0; j < componentSerializers.length; j++) {
          const bytesWritten = componentSerializers[j](view, offset, entityId);
          if (bytesWritten > 0) {
            componentMask |= 1 << j;
            offset += bytesWritten;
          }
        }
        maskSetter(view, maskOffset, componentMask);
      } else {
        offset += typeSetters[$u32](view, offset, entityId);
        for (let j = 0; j < componentSerializers.length; j++) {
          offset += componentSerializers[j](view, offset, entityId);
        }
      }
    }
    return buffer.slice(0, offset);
  };
};
var createAoSDeserializer = (components, options = {}) => {
  const { diff = false } = options;
  const componentDeserializers = components.map((component) => createAoSComponentDeserializer(component));
  return (packet, entityIdMapping) => {
    const view = new DataView(packet);
    let offset = 0;
    while (offset < packet.byteLength) {
      const { value: originalEntityId, size: entityIdSize } = typeGetters[$u32](view, offset);
      offset += entityIdSize;
      const entityId = entityIdMapping ? entityIdMapping.get(originalEntityId) ?? originalEntityId : originalEntityId;
      if (diff) {
        const maskGetter = components.length <= 8 ? typeGetters[$u8] : components.length <= 16 ? typeGetters[$u16] : typeGetters[$u32];
        const { value: componentMask, size: maskSize } = maskGetter(view, offset);
        offset += maskSize;
        for (let i = 0; i < components.length; i++) {
          if (componentMask & 1 << i) {
            offset += componentDeserializers[i](view, offset, entityId);
          }
        }
      } else {
        for (let i = 0; i < componentDeserializers.length; i++) {
          offset += componentDeserializers[i](view, offset, entityId);
        }
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
    const soaSerializer = createSoASerializer(components, { buffer: buffer.slice(offset) });
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
  $str,
  $u16,
  $u32,
  $u8,
  array,
  createAoSDeserializer,
  createAoSSerializer,
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
  str,
  u16,
  u32,
  u8
};
//# sourceMappingURL=index.mjs.map
