declare module 'bitecs' {
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
    eid: "eid"
  };

  export type TypedArray =
    | Uint8Array
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

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
    [Types.eid]: Uint32Array;
  }

  export enum DESERIALIZE_MODE {
    REPLACE,
    APPEND,
    MAP
  }

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

  export type ComponentProp = TypedArray | Array<TypedArray>

  export interface IWorld {}

  export interface ISchema {
    [key: string]: Type | ListType | ISchema
  }

  export interface IComponentProp {
  }

  export interface IComponent {
  }

  export type Component = IComponent | ComponentType<ISchema>

  export type QueryModifier<W extends IWorld = IWorld> = (c: (IComponent | IComponentProp)[]) => (world: W) => IComponent | QueryModifier<W>

  export type Query<W extends IWorld = IWorld> = (world: W, clearDiff?: Boolean) => number[]

  export type System<R extends any[] = any[], W extends IWorld = IWorld> = (world: W, ...args: R) => W

  export type Serializer<W extends IWorld = IWorld> = (target: W | number[]) => ArrayBuffer
  export type Deserializer<W extends IWorld = IWorld> = (world: W, packet: ArrayBuffer, mode?: DESERIALIZE_MODE) => number[]

  export function setDefaultSize(size: number): void
  export function setRemovedRecycleThreshold(newThreshold: number): void
  export function createWorld<W extends IWorld = IWorld>(obj?: W, size?: number): W
  export function createWorld<W extends IWorld = IWorld>(size?: number): W
  export function resetWorld<W extends IWorld = IWorld>(world: W): W
  export function deleteWorld<W extends IWorld = IWorld>(world: W): void
  export function addEntity<W extends IWorld = IWorld>(world: W): number
  export function removeEntity<W extends IWorld = IWorld>(world: W, eid: number): void
  export function entityExists<W extends IWorld = IWorld>(world: W, eid: number): boolean
  export function getWorldComponents<W extends IWorld = IWorld>(world: W): Component[]
  export function getAllEntities<W extends IWorld = IWorld>(world: W): number[]

  export function registerComponent<W extends IWorld = IWorld>(world: W, component: Component): void
  export function registerComponents<W extends IWorld = IWorld>(world: W, components: Component[]): void
  export function defineComponent<T extends ISchema>(schema?: T, size?: number): ComponentType<T>
  export function defineComponent<T>(schema?: any, size?: number): T
  export function addComponent<W extends IWorld = IWorld>(world: W, component: Component, eid: number, reset?: boolean): void
  export function removeComponent<W extends IWorld = IWorld>(world: W, component: Component, eid: number, reset?: boolean): void
  export function hasComponent<W extends IWorld = IWorld>(world: W, component: Component, eid: number): boolean
  export function getEntityComponents<W extends IWorld = IWorld>(world: W, eid: number): Component[]

  export function defineQuery<W extends IWorld = IWorld>(components: (Component | QueryModifier<W>)[]): Query<W>
  export function Changed<W extends IWorld = IWorld>(c: Component | ISchema): Component | QueryModifier<W>
  export function Not<W extends IWorld = IWorld>(c: Component | ISchema): Component | QueryModifier<W>
  export function enterQuery<W extends IWorld = IWorld>(query: Query<W>): Query<W>
  export function exitQuery<W extends IWorld = IWorld>(query: Query<W>): Query<W>
  export function resetChangedQuery<W extends IWorld = IWorld>(world: W, query: Query<W>): Query<W>
  export function removeQuery<W extends IWorld = IWorld>(world: W, query: Query<W>): Query<W>
  export function commitRemovals<W extends IWorld = IWorld>(world: W): void

  export function defineSystem<R extends any[] = any[], W extends IWorld = IWorld>(update: (world: W, ...args: R) => W): System<R, W>

  export function defineSerializer<W extends IWorld = IWorld>(target: W | Component[] | IComponentProp[] | QueryModifier<W>, maxBytes?: number): Serializer<W>
  export function defineDeserializer<W extends IWorld = IWorld>(target: W | Component[] | IComponentProp[] | QueryModifier<W>): Deserializer<W>
  
  export function pipe(...fns: ((...args: any[]) => any)[]): (...input: any[]) => any
  
  export const parentArray: Symbol
}
