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

type Query = (world: IWorld) => number[]

type System = (world: IWorld) => void

export default interface IBitECS {
  createWorld: (size?: number) => IWorld
  addEntity: (world: IWorld) => number
  removeEntity: (world: IWorld, eid: number) => void
  registerComponent: (world: IWorld, component: IComponent) => void
  registerComponents: (world: IWorld, components: IComponent[]) => void
  defineComponent: (schema: ISchema) => IComponent
  addComponent: (world: IWorld, component: IComponent, eid: number)  => void
  removeComponent: (world: IWorld, component: IComponent, eid: number) => void
  hasComponent: (world: IWorld, component: IComponent, eid: number) => boolean
  defineQuery: (components: (IComponent | IComponentProp)[]) => Query
  Changed: (c: (IComponent | IComponentProp)[]) => (world: IWorld) => IComponent | IComponentProp
  Not: (c: (IComponent | IComponentProp)[]) => (world: IWorld) => IComponent | IComponentProp
  enterQuery: (world: IWorld, query: Query, fn: (eid: number) => void) => void
  exitQuery: (world: IWorld, query: Query, fn: (eid: number) => void) => void
  commitRemovals: (world: IWorld) => void
  defineSystem: (update: (world: IWorld) => void) => System
  defineSerializer: (target: IWorld | IComponent | IComponentProp, maxBytes?: number) => (target: IWorld | number[]) => ArrayBuffer
  defineDeserializer: (target: IWorld | IComponent | IComponentProp) => (world: IWorld, packet: ArrayBuffer) => void
}