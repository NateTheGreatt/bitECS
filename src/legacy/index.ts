import { ComponentRef, QueryTerm, observe, onAdd, onRemove, query, EntityId } from '../core'
import {
  addComponent as ecsAddComponent,
  hasComponent as ecsHasComponent,
  removeComponent as ecsRemoveComponent
} from '../core'

export interface IWorld { }

export const defineQuery = (terms: QueryTerm[]) => {
  const queryFn = (world: IWorld) => query(world, terms)
  queryFn.terms = terms
  return queryFn
}

export const enterQuery = (queryFn: ReturnType<typeof defineQuery>) => {
  let queue: number[] = []
  const initSet = new WeakSet<IWorld>()
  return (world: IWorld) => {
    if (!initSet.has(world)) {
      observe(world, onAdd(...queryFn.terms), (eid: EntityId) => queue.push(eid))
      initSet.add(world)
    }
    const results = queue.slice()
    queue.length = 0
    return results
  }
}

export const exitQuery = (queryFn: ReturnType<typeof defineQuery>) => {
  let queue: number[] = []
  const initSet = new WeakSet<IWorld>()
  return (world: IWorld) => {
    if (!initSet.has(world)) {
      observe(world, onRemove(...queryFn.terms), (eid: EntityId) => queue.push(eid))
      initSet.add(world)
    }
    const results = queue.slice()
    queue.length = 0
    return results
  }
}

export const addComponent = (world: IWorld, component: ComponentRef, eid: EntityId) =>
  ecsAddComponent(world, eid, component)

export const hasComponent = (world: IWorld, component: ComponentRef, eid: EntityId) =>
  ecsHasComponent(world, eid, component)

export const removeComponent = (world: IWorld, component: ComponentRef, eid: EntityId) =>
  ecsRemoveComponent(world, eid, component)

export interface ISchema {
  [key: string]: Type | ListType | ISchema
}

export type Type =
  | 'i8'
  | 'ui8'
  | 'ui8c'
  | 'i16'
  | 'ui16'
  | 'i32'
  | 'ui32'
  | 'f32'
  | 'f64'
  | 'eid'

export type ListType = readonly [Type, number];

export const Types = {
  i8: 'i8' as Type,
  ui8: 'ui8' as Type,
  ui8c: 'ui8c' as Type,
  i16: 'i16' as Type,
  ui16: 'ui16' as Type,
  i32: 'i32' as Type,
  ui32: 'ui32' as Type,
  f32: 'f32' as Type,
  f64: 'f64' as Type,
  eid: 'eid' as Type
};

export type TypedArray =
  | Uint8Array
  | Int8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array

export type ArrayByType = {
  'i8': Int8Array;
  'ui8': Uint8Array;
  'ui8c': Uint8ClampedArray;
  'i16': Int16Array;
  'ui16': Uint16Array;
  'i32': Int32Array;
  'ui32': Uint32Array;
  'f32': Float32Array;
  'f64': Float64Array;
  'eid': Uint32Array;
}

// ... existing code ...

const arrayByTypeMap: { [key in Type]: any } = {
  'i8': Int8Array,
  'ui8': Uint8Array,
  'ui8c': Uint8ClampedArray,
  'i16': Int16Array,
  'ui16': Uint16Array,
  'i32': Int32Array,
  'ui32': Uint32Array,
  'f32': Float32Array,
  'f64': Float64Array,
  'eid': Uint32Array,
};

export type ComponentType<T extends ISchema> = {
  [key in keyof T]:
  T[key] extends Type
  ? ArrayByType[T[key]]
  : T[key] extends [infer RT, number]
  ? RT extends Type
  ? Array<ArrayByType[RT]>
  : unknown
  : T[key] extends ISchema
  ? ComponentType<T[key]>
  : unknown;
};

export const defineComponent = <T extends ISchema>(schema: T, max: number = 1e5): ComponentType<T> => {
  const createSoA = <U extends ISchema>(schema: U, max: number): ComponentType<U> => {
    const component = {} as ComponentType<U>
    for (const key in schema) {
      if (Array.isArray(schema[key])) {
        const [type, length] = schema[key] as [Type, number]
        component[key] = Array.from({ length }, () => new arrayByTypeMap[type](max)) as any
      } else if (typeof schema[key] === 'object') {
        component[key] = createSoA(schema[key] as ISchema, max) as any
      } else {
        const type = schema[key] as Type;
        const TypeConstructor = arrayByTypeMap[type];
        if (TypeConstructor) {
          component[key] = new TypeConstructor(max) as any;
        } else {
          throw new Error(`Unsupported type: ${schema[key]}`);
        }
      }
    }
    return component
  }
  return createSoA(schema, max)
}