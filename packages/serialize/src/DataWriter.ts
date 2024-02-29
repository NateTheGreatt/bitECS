import { flatten } from "./Utils.js";
import {
  createViewCursor,
  spaceUint64,
  spaceUint32,
  spaceUint16,
  spaceUint8,
  writeProp,
  sliceViewCursor,
  writePropIfChanged,
  moveViewCursor,
  writeUint32,
} from "./ViewCursor.js";
import {
  Component,
  ComponentWriter,
  DataViewWithCursor,
  EntityWriter,
  IdMap,
} from "./types.js";

/**
 * Writes a component dynamically
 * (less efficient than statically due to inner loop)
 *
 * @param  {any} component
 */
export const writeComponent = (
  component: Component,
  diff: boolean
): ComponentWriter => {
  // todo: test performance of using flatten in the return scope vs this scope
  const props = flatten(component);
  const changeMaskSpacer =
    props.length <= 8
      ? spaceUint8
      : props.length <= 16
      ? spaceUint16
      : spaceUint32;

  // todo: support more than 64 props (use a function which generates multiple spacers)

  const properWriter = diff ? writePropIfChanged : writeProp;

  return (v: DataViewWithCursor, entity: number) => {
    const writeChangeMask = diff ? changeMaskSpacer(v) : () => {};
    let changeMask = 0;

    for (let i = 0; i < props.length; i++) {
      changeMask |= properWriter(v, props[i], entity) ? 1 << i : 0b0;
    }

    writeChangeMask(changeMask);

    return changeMask > 0 ? 1 : 0;
  };
};

export const writeEntity = (
  componentWriters: ComponentWriter[],
  diff: boolean
) => {
  const changeMaskSpacer =
    componentWriters.length <= 8
      ? spaceUint8
      : componentWriters.length <= 16
      ? spaceUint16
      : spaceUint32;

  // todo: support more than 64 components (use a function which generates multiple spacers)

  return (v: DataViewWithCursor, entity: number) => {
    const rewind = v.cursor;

    writeUint32(v, entity);

    const writeChangeMask = diff ? changeMaskSpacer(v) : () => {};

    let changeMask = 0;

    for (let i = 0, l = componentWriters.length; i < l; i++) {
      const write = componentWriters[i];
      changeMask |= write(v, entity) ? 1 << i : 0;
    }

    if (changeMask > 0) {
      writeChangeMask(changeMask);
      return 1;
    } else {
      moveViewCursor(v, rewind);
      return 0;
    }
  };
};

export const createEntityWriter = (
  components: Component[],
  diff: boolean
): EntityWriter =>
  writeEntity(
    components.map((c) => writeComponent(c, diff)),
    diff
  );

export const writeEntities = (
  entityWriter: EntityWriter,
  v: DataViewWithCursor,
  entities: number[],
  idMap: IdMap
) => {
  const writeCount = spaceUint32(v);

  let count = 0;
  for (let i = 0, l = entities.length; i < l; i++) {
    const eid = idMap ? idMap.get(entities[i])! : entities[i];
    count += entityWriter(v, eid);
  }

  writeCount(count);

  return sliceViewCursor(v);
};

export const createDataWriter = (
  components: Component[],
  diff = false,
  size = 100000
) => {
  const view = createViewCursor(new ArrayBuffer(size));

  const entityWriter = createEntityWriter(components, diff);

  return (entities: number[], idMap: IdMap) => {
    return writeEntities(entityWriter, view, entities, idMap);
  };
};
