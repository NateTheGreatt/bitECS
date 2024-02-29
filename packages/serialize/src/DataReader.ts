import { flatten } from "./Utils.js";
import {
  createViewCursor,
  readProp,
  readUint8,
  readUint16,
  readUint32,
  readUint64,
} from "./ViewCursor.js";
import {
  Component,
  ComponentReader,
  DataReader,
  DataViewWithCursor,
  EntityReader,
  IdMap,
  TypedArray,
} from "./types.js";

export const checkBitflag = (changeMask: number, flag: number) =>
  (changeMask & flag) === flag;

export const readComponentProp = (
  v: DataViewWithCursor,
  prop: TypedArray,
  entity: number
) => {
  prop[entity] = readProp(v, prop);
};

/**
 * Reads a component dynamically
 * (less efficient than statically due to inner loop)
 *
 * @param  {any} component
 */
export const readComponent = (
  component: Component,
  diff: boolean
): ComponentReader => {
  // todo: test performance of using flatten in this scope vs return function scope
  const props = flatten(component);
  const readChanged =
    props.length <= 8
      ? readUint8
      : props.length <= 16
      ? readUint16
      : props.length <= 32
      ? readUint32
      : readUint32;

  return (v: DataViewWithCursor, entity: number) => {
    const changeMask = diff ? readChanged(v) : Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < props.length; i++) {
      // skip reading property if not in the change mask
      if (diff && !checkBitflag(changeMask, 1 << i)) {
        continue;
      }
      readComponentProp(v, props[i], entity);
    }
  };
};

export const readEntity = (
  componentReaders: ComponentReader[],
  diff: boolean
) => {
  const readChanged =
    componentReaders.length <= 8
      ? readUint8
      : componentReaders.length <= 16
      ? readUint16
      : componentReaders.length <= 32
      ? readUint32
      : readUint32;

  return (v: DataViewWithCursor, idMap: IdMap) => {
    const id = readUint32(v);
    const entity = idMap ? idMap.get(id) : id;
    if (entity === undefined) throw new Error("entity not found in idMap");

    const changeMask = diff ? readChanged(v) : Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < componentReaders.length; i++) {
      // skip reading component if not in the changeMask
      if (diff && !checkBitflag(changeMask, 1 << i)) {
        continue;
      }
      const read = componentReaders[i];
      read(v, entity);
    }
  };
};

export const createEntityReader = (
  components: Component[],
  diff: boolean
): EntityReader =>
  readEntity(
    components.map((c) => readComponent(c, diff)),
    diff
  );

export const readEntities = (
  entityReader: EntityReader,
  v: DataViewWithCursor,
  idMap: IdMap,
  packet: ArrayBuffer
) => {
  while (v.cursor < packet.byteLength) {
    const count = readUint32(v);
    for (let i = 0; i < count; i++) {
      entityReader(v, idMap);
    }
  }
};

export const createDataReader = (
  components: Component[],
  diff = false
): DataReader => {
  const entityReader = createEntityReader(components, diff);

  return (packet: ArrayBuffer, idMap: IdMap) => {
    const view = createViewCursor(packet);
    return readEntities(entityReader, view, idMap, packet);
  };
};
