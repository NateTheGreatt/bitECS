import { ComponentRef, QueryTerm, World, observe, onAdd, onRemove, query, addComponent as ecsAddComponent, EntityId } from '../core'

export const defineQuery = (...terms: QueryTerm[]) => (world: World) => query(world, terms)

export const enterQuery = (...terms: QueryTerm[]) => {
  let queue: number[] = []
  const initSet = new WeakSet<World>()
  return (world: World) => {
    if (!initSet.has(world)) {
      observe(world, onAdd(...terms), (eid: EntityId) => queue.push(eid))
      initSet.add(world)
    }
    const results = queue
    queue = []
    return results
  }
}

export const exitQuery = (...terms: QueryTerm[]) => {
  let queue: number[] = []
  const initSet = new WeakSet<World>()
  return (world: World) => {
    if (!initSet.has(world)) {
      observe(world, onRemove(...terms), (eid: EntityId) => queue.push(eid))
      initSet.add(world)
    }
    const results = queue
    queue = []
    return results
  }
}

export const addComponent = (world: World, component: ComponentRef, eid: EntityId) =>
  ecsAddComponent(world, eid, component)

export type Schema = { [key: string]: Schema | PrimitiveType | [PrimitiveType, number] }

export type PrimitiveType = 'f32' | 'i32' | 'u32' | 'f64' | 'i8' | 'u8' | 'i16' | 'u16';

export const Types = {
  f32: 'f32' as PrimitiveType,
  i32: 'i32' as PrimitiveType,
  u32: 'u32' as PrimitiveType,
  f64: 'f64' as PrimitiveType,
  i8: 'i8' as PrimitiveType,
  u8: 'u8' as PrimitiveType,
  i16: 'i16' as PrimitiveType,
  u16: 'u16' as PrimitiveType
};

type ArrayByType = {
  'f32': Float32Array,
  'i32': Int32Array,
  'u32': Uint32Array,
  'f64': Float64Array,
  'i8': Int8Array,
  'u8': Uint8Array,
  'i16': Int16Array,
  'u16': Uint16Array
};

const arrayByTypeMap: { [key in PrimitiveType]: any } = {
  'f32': Float32Array,
  'i32': Int32Array,
  'u32': Uint32Array,
  'f64': Float64Array,
  'i8': Int8Array,
  'u8': Uint8Array,
  'i16': Int16Array,
  'u16': Uint16Array
};

export type ComponentType<T extends Schema> = {
  [key in keyof T]:
    T[key] extends PrimitiveType
    ? ArrayByType[T[key]]
    : T[key] extends [infer RT, number]
      ? RT extends PrimitiveType
        ? ArrayByType[RT][]
        : unknown
      : T[key] extends Schema
        ? ComponentType<T[key]>
        : unknown;
};

export const defineComponent = <T extends Schema>(schema: T, max: number = 1e5): ComponentType<T> => {
  const createSoA = <U extends Schema>(schema: U, max: number): ComponentType<U> => {
    const component = {} as ComponentType<U>
    for (const key in schema) {
      if (Array.isArray(schema[key])) {
        const [type, length] = schema[key] as [PrimitiveType, number]
        component[key] = Array.from({ length }, () => new arrayByTypeMap[type](max)) as any
      } else if (typeof schema[key] === 'object') {
        component[key] = createSoA(schema[key] as Schema, max) as any
      } else {
        const type = schema[key] as PrimitiveType;
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