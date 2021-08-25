declare module 'bitecs' {
  export type Type =
    'i8' |
    'ui8' |
    'ui8c' |
    'i16' |
    'ui16' |
    'i32' |
    'ui32' |
    'f32' |
    'f64'

  export type ListType = readonly [Type, number];

  export const Types: {
    i8: "i8"
    ui8: "ui8"
    ui8c: "ui8c"
    i16: "i16"
    ui16: "ui16"
    i32: "i32"
    ui32: "ui32"
    f32: "f32"
    f64: "f64"
  };

  export type TypedArray =
    Uint8Array |
    Int8Array |
    Uint8Array |
    Uint8ClampedArray |
    Int16Array |
    Uint16Array |
    Int32Array |
    Uint32Array |
    Float32Array |
    Float64Array

  export type ArrayByType = {
    [Types.i8]: Int8Array;
    [Types.ui8]: Uint8Array;
    [Types.ui8c]: Uint8ClampedArray;
    [Types.i16]: Int16Array;
    [Types.ui16]: Uint16Array;
    [Types.i32]: Int32Array;
    [Types.ui32]: Uint32Array;
    [Types.f32]: Float32Array;
    [Types.f64]: Float64Array;
  }

  export enum DESERIALIZE_MODE {
    REPLACE,
    APPEND,
    MAP
  }

  type BuildPowersOf2LengthArrays<N extends number, R extends never[][]> = R[0][N] extends never ? R : BuildPowersOf2LengthArrays<N, [[...R[0], ...R[0]], ...R]>;
  type ConcatLargestUntilDone<N extends number, R extends never[][], B extends never[]> = B["length"] extends N ? B : [...R[0], ...B][N] extends never
    ? ConcatLargestUntilDone<N, R extends [R[0], ...infer U] ? U extends never[][] ? U : never : never, B>
    : ConcatLargestUntilDone<N, R extends [R[0], ...infer U] ? U extends never[][] ? U : never : never, [...R[0], ...B]>;
  type Replace<R extends any[], T> = { [K in keyof R]: T }
  type TupleOf<T, N extends number> = number extends N ? T[] : {
    [K in N]:
    BuildPowersOf2LengthArrays<K, [[never]]> extends infer U ? U extends never[][]
    ? Replace<ConcatLargestUntilDone<K, U, []>, T> : never : never;
  }[N]
  type TuplePop<T> = T extends [any, ...infer L] ? L : never

  export type ArrayType<T, L extends number> = Omit<T, number> & {length: L} & {[K in NonNullable<Partial<TuplePop<TupleOf<any, L>>>["length"]>]: number}

  export type ComponentType<T extends ISchema> = {
    [K in keyof T]: T[K] extends Type
    ? ArrayByType[T[K]]
    : T[K] extends readonly [infer RT, number]
    ? RT extends Type
      ? T[K] extends readonly [RT, infer L]
        ? L extends number
          ? number extends L
            ? ArrayByType[RT][]
            : ArrayType<ArrayByType[RT], L>[]
          : unknown
        : unknown
      : unknown
    : T[K] extends ISchema
    ? ComponentType<T[K]>
    : unknown
  } & {}

  export interface IWorld {
    [key: string]: any
  }

  export interface ISchema {
    [key: string]: Type | ListType | ISchema
  }

  export interface IComponentProp {
    [key: string]: TypedArray | Array<TypedArray>
  }

  export interface IComponent {
    [key: string]: TypedArray | IComponentProp
  }

  export type Component = IComponent | ComponentType<ISchema>

  export type QueryModifier = (c: (IComponent | IComponentProp)[]) => (world: IWorld) => IComponent | QueryModifier

  export type Query = (world: IWorld, clearDiff?: Boolean) => number[]

  export type System = (world: IWorld, ...args: any[]) => IWorld

  export type Serializer = (target: IWorld | number[]) => ArrayBuffer
  export type Deserializer = (world: IWorld, packet: ArrayBuffer, mode?: DESERIALIZE_MODE) => void

  export function setDefaultSize(size: number): void
  export function createWorld(): IWorld
  export function resetWorld(world: IWorld): IWorld
  export function deleteWorld(world: IWorld): void
  export function addEntity(world: IWorld): number
  export function removeEntity(world: IWorld, eid: number): void

  export function registerComponent(world: IWorld, component: Component): void
  export function registerComponents(world: IWorld, components: Component[]): void
  export function defineComponent<T extends ISchema>(schema?: T): ComponentType<T>
  export function addComponent(world: IWorld, component: Component, eid: number): void
  export function removeComponent(world: IWorld, component: Component, eid: number): void
  export function hasComponent(world: IWorld, component: Component, eid: number): boolean
  export function getEntityComponents(world: IWorld, eid: number): Component[]

  export function defineQuery(components: (Component | QueryModifier)[]): Query
  export function Changed(c: Component): Component | QueryModifier
  export function Not(c: Component): Component | QueryModifier
  export function enterQuery(query: Query): Query
  export function exitQuery(query: Query): Query
  export function resetChangedQuery(world: IWorld, query: Query): Query
  export function removeQuery(world: IWorld, query: Query): Query
  export function commitRemovals(world: IWorld): void

  export function defineSystem(update: (world: IWorld, ...args: any[]) => IWorld): System

  export function defineSerializer(target: IWorld | Component[] | IComponentProp[] | QueryModifier, maxBytes?: number): Serializer
  export function defineDeserializer(target: IWorld | Component[] | IComponentProp[] | QueryModifier): Deserializer

  export function pipe(...fns: ((...args: any[]) => any)[]): (...input: any[]) => any

  export const parentArray: Symbol
}
