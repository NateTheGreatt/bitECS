import { DataViewWithCursor, TypedArray } from "./types";

export const createViewCursor = (
  buffer = new ArrayBuffer(100000)
): DataViewWithCursor => {
  const view = new DataView(buffer) as DataViewWithCursor;
  view.cursor = 0;
  view.shadowMap = new Map();
  return view;
};

export const sliceViewCursor = (v: DataViewWithCursor) => {
  const packet = v.buffer.slice(0, v.cursor);
  v.cursor = 0;
  return packet;
};

export const scrollViewCursor = (v: DataViewWithCursor, amount: number) => {
  v.cursor += amount;
  return v;
};

export const moveViewCursor = (v: DataViewWithCursor, where: number) => {
  v.cursor = where;
  return v;
};

/* Writers */

// dynamically obtains primitive type of passed in TypedArray object
// todo: memoize prop type
// todo: minificatoin will erase the constructor name
export const writeProp = (
  v: DataViewWithCursor,
  prop: TypedArray,
  entity: number
) => {
  // @ts-expect-error
  v[`set${prop.constructor.name.replace("Array", "")}`](v.cursor, prop[entity]);
  v.cursor += prop.BYTES_PER_ELEMENT;
  return v;
};

export const writePropIfChanged = (
  v: DataViewWithCursor,
  prop: TypedArray,
  entity: number
) => {
  const { shadowMap } = v;

  // todo: decide if initialization counts as a change (probably shouldn't)
  // const shadowInit = !shadowMap.has(prop)

  const shadow =
    shadowMap.get(prop) ||
    (shadowMap.set(prop, prop.slice().fill(0)) && shadowMap.get(prop));

  const changed = shadow[entity] !== prop[entity]; // || shadowInit

  shadow[entity] = prop[entity];

  if (!changed) {
    return false;
  }

  writeProp(v, prop, entity);

  return true;
};

export const writeFloat64 = (v: DataViewWithCursor, value: number) => {
  v.setFloat64(v.cursor, value);
  v.cursor += Float64Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeFloat32 = (v: DataViewWithCursor, value: number) => {
  v.setFloat32(v.cursor, value);
  v.cursor += Float32Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeUint64 = (v: DataViewWithCursor, value: bigint) => {
  v.setBigUint64(v.cursor, value);
  v.cursor += BigUint64Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeInt64 = (v: DataViewWithCursor, value: bigint) => {
  v.setBigInt64(v.cursor, value);
  v.cursor += BigInt64Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeUint32 = (v: DataViewWithCursor, value: number) => {
  v.setUint32(v.cursor, value);
  v.cursor += Uint32Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeInt32 = (v: DataViewWithCursor, value: number) => {
  v.setInt32(v.cursor, value);
  v.cursor += Int32Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeUint16 = (v: DataViewWithCursor, value: number) => {
  v.setUint16(v.cursor, value);
  v.cursor += Uint16Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeInt16 = (v: DataViewWithCursor, value: number) => {
  v.setInt16(v.cursor, value);
  v.cursor += Int16Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeUint8 = (v: DataViewWithCursor, value: number) => {
  v.setUint8(v.cursor, value);
  v.cursor += Uint8Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeInt8 = (v: DataViewWithCursor, value: number) => {
  v.setInt8(v.cursor, value);
  v.cursor += Int8Array.BYTES_PER_ELEMENT;
  return v;
};

/* Spacers */

export const spaceFloat64 = (v: DataViewWithCursor) => {
  const savePoint = v.cursor;
  v.cursor += Float64Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setFloat64(savePoint, value);
    return v;
  };
};

export const spaceFloat32 = (v: DataViewWithCursor) => {
  const savePoint = v.cursor;
  v.cursor += Float32Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setFloat32(savePoint, value);
    return v;
  };
};

export const spaceUint64 = (v: DataViewWithCursor) => {
  const savePoint = v.cursor;
  v.cursor += BigUint64Array.BYTES_PER_ELEMENT;
  return (value: bigint) => {
    v.setBigUint64(savePoint, value);
    return v;
  };
};

export const spaceInt64 = (v: DataViewWithCursor) => {
  const savePoint = v.cursor;
  v.cursor += BigInt64Array.BYTES_PER_ELEMENT;
  return (value: bigint) => {
    v.setBigInt64(savePoint, value);
    return v;
  };
};

export const spaceUint32 = (v: DataViewWithCursor) => {
  const savePoint = v.cursor;
  v.cursor += Uint32Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setUint32(savePoint, value);
    return v;
  };
};

export const spaceInt32 = (v: DataViewWithCursor) => {
  const savePoint = v.cursor;
  v.cursor += Int32Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setInt32(savePoint, value);
    return v;
  };
};

export const spaceUint16 = (v: DataViewWithCursor) => {
  const savePoint = v.cursor;
  v.cursor += Uint16Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setUint16(savePoint, value);
    return v;
  };
};

export const spaceInt16 = (v: DataViewWithCursor) => {
  const savePoint = v.cursor;
  v.cursor += Int16Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setInt16(savePoint, value);
    return v;
  };
};

export const spaceUint8 = (v: DataViewWithCursor) => {
  const savePoint = v.cursor;
  v.cursor += Uint8Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setUint8(savePoint, value);
    return v;
  };
};

export const spaceInt8 = (v: DataViewWithCursor) => {
  const savePoint = v.cursor;
  v.cursor += Int8Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setInt8(savePoint, value);
    return v;
  };
};

/* Readers */

// dynamically obtains primitive type of passed in TypedArray object
// todo: memoize prop type
export const readProp = (v: DataViewWithCursor, prop: TypedArray) => {
  // @ts-expect-error
  const val = v[`get${prop.constructor.name.replace("Array", "")}`](v.cursor);
  v.cursor += prop.BYTES_PER_ELEMENT;
  return val;
};

export const readFloat64 = (v: DataViewWithCursor) => {
  const val = v.getFloat64(v.cursor);
  v.cursor += Float64Array.BYTES_PER_ELEMENT;
  return val;
};

export const readFloat32 = (v: DataViewWithCursor) => {
  const val = v.getFloat32(v.cursor);
  v.cursor += Float32Array.BYTES_PER_ELEMENT;
  return val;
};

export const readUint64 = (v: DataViewWithCursor) => {
  const val = v.getBigUint64(v.cursor);
  v.cursor += BigUint64Array.BYTES_PER_ELEMENT;
  return val;
};

export const readInt64 = (v: DataViewWithCursor) => {
  const val = v.getBigUint64(v.cursor);
  v.cursor += BigInt64Array.BYTES_PER_ELEMENT;
  return val;
};

export const readUint32 = (v: DataViewWithCursor) => {
  const val = v.getUint32(v.cursor);
  v.cursor += Uint32Array.BYTES_PER_ELEMENT;
  return val;
};

export const readInt32 = (v: DataViewWithCursor) => {
  const val = v.getInt32(v.cursor);
  v.cursor += Int32Array.BYTES_PER_ELEMENT;
  return val;
};

export const readUint16 = (v: DataViewWithCursor) => {
  const val = v.getUint16(v.cursor);
  v.cursor += Uint16Array.BYTES_PER_ELEMENT;
  return val;
};

export const readInt16 = (v: DataViewWithCursor) => {
  const val = v.getInt16(v.cursor);
  v.cursor += Int16Array.BYTES_PER_ELEMENT;
  return val;
};

export const readUint8 = (v: DataViewWithCursor) => {
  const val = v.getUint8(v.cursor);
  v.cursor += Uint8Array.BYTES_PER_ELEMENT;
  return val;
};

export const readInt8 = (v: DataViewWithCursor) => {
  const val = v.getInt8(v.cursor);
  v.cursor += Int8Array.BYTES_PER_ELEMENT;
  return val;
};
