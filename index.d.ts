declare module 'bitecs' {
  export type Type =
    'bool' |
    'i8' |
    'ui8' |
    'ui8c' |
    'i16' |
    'ui16' |
    'i32' |
    'ui32' |
    'f32' |
    'f64'

  export const Types: {
    i8: string
    ui8: string
    ui8c: string
    i16: string
    ui16: string
    i32: string
    ui32: string
    f32: string
    f64: string
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

  interface IWorld {
    [key: string]: any
  }

  interface ISchema {
    [key: string]: Type | ISchema
  }

  interface IComponentProp {
    [key: string]: TypedArray
  }

  interface IComponent {
    [key: string]: TypedArray | IComponentProp
  }

  type QueryModifier = (c: (IComponent | IComponentProp)[]) => (world: IWorld) => IComponent | IComponentProp

  type Query = (world: IWorld) => number[]

  type System = (world: IWorld) => void

  
  export function createWorld (size?: number): IWorld
  export function addEntity (world: IWorld): number
  export function removeEntity (world: IWorld, eid: number): void
  export function registerComponent (world: IWorld, component: IComponent): void
  export function registerComponents (world: IWorld, components: IComponent[]): void
  export function defineComponent (schema: ISchema): IComponent
  export function addComponent (world: IWorld, component: IComponent, eid: number): void
  export function removeComponent (world: IWorld, component: IComponent, eid: number): void
  export function hasComponent (world: IWorld, component: IComponent, eid: number): boolean
  export function defineQuery (components: (IComponent | QueryModifier)[]): Query
  export function Changed (c: (IComponent | IComponentProp)[]): (world: IWorld) => IComponent | IComponentProp
  export function Not (c: (IComponent | IComponentProp)[]): (world: IWorld) => IComponent | IComponentProp
  export function enterQuery (world: IWorld, query: Query, fn: (eid: number) => void): void
  export function exitQuery (world: IWorld, query: Query, fn: (eid: number) => void): void
  export function commitRemovals (world: IWorld): void
  export function defineSystem (update: (world: IWorld) => void): System
  export function defineSerializer (target: IWorld | IComponent | IComponentProp | QueryModifier, maxBytes?: number): (target: IWorld | number[]) => ArrayBuffer
  export function defineDeserializer (target: IWorld | IComponent | IComponentProp | QueryModifier): (world: IWorld, packet: ArrayBuffer) => void
  export function pipe(...fns: ((...args: any[]) => any)[]): (input: any) => any
}