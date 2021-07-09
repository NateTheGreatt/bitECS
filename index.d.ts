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

  export type ComponentType<T extends ISchema> = {
    [key in keyof T]: T[key] extends Type ? ArrayByType[T[key]] : T[key] extends ISchema ? ComponentType<T[key]> : unknown;
  }

  export interface IWorld {
    [key: string]: any
  }

  export interface ISchema {
    [key: string]: Type | [Type, number] | ISchema
  }

  export interface IComponentProp {
    [key: string]: TypedArray
  }

  export interface IComponent {
    [key: string]: TypedArray | IComponentProp
  }

  export type Component = IComponent | ComponentType<ISchema>

  export type QueryModifier = (c: (IComponent | IComponentProp)[]) => (world: IWorld) => IComponent | QueryModifier

  export type Query = (world: IWorld, clearDiff?: Boolean) => number[]

  export type System = (world: IWorld) => IWorld

  export function setDefaultSize(size: number): void
  export function createWorld(size?: number): IWorld
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

  export function defineQuery(components: (Component | QueryModifier)[]): Query
  export function Changed(c: Component): Component | QueryModifier
  export function Not(c: Component): Component | QueryModifier
  export function enterQuery(query: Query): Query
  export function exitQuery(query: Query): Query
  export function resetChangedQuery(world: IWorld, query: Query): Query
  export function removeQuery(world: IWorld, query: Query): Query
  export function commitRemovals(world: IWorld): void

  export function defineSystem(update: (world: IWorld, ...args: any[]) => IWorld): System

  export function defineSerializer(target: IWorld | Component[] | IComponentProp[] | QueryModifier, maxBytes?: number): (target: IWorld | number[]) => ArrayBuffer
  export function defineDeserializer(target: IWorld | Component[] | IComponentProp[] | QueryModifier): (world: IWorld, packet: ArrayBuffer, mode?: DESERIALIZE_MODE) => void
  
  export function pipe(...fns: ((...args: any[]) => any)[]): (...input: any[]) => any

  export const parentArray: Symbol
  
  export interface IAppliedAPI {
    setDefaultSize(size: number): void
    resetWorld(): IWorld
    deleteWorld(): void
    addEntity(): number
    removeEntity(eid: number): void

    registerComponent(component: Component): void
    registerComponents(components: Component[]): void
    defineComponent<T extends ISchema>(schema?: T): ComponentType<T>
    addComponent(component: Component, eid: number): void
    removeComponent(component: Component, eid: number): void
    hasComponent(component: Component, eid: number): boolean

    defineQuery(components: (Component | QueryModifier)[]): Query
    Changed(c: Component): Component | QueryModifier
    Not(c: Component): Component | QueryModifier
    enterQuery(query: Query): Query
    exitQuery(query: Query): Query
    resetChangedQuery(query: Query): Query
    removeQuery(query: Query): Query
    commitRemovals(): void

    defineSystem(update: (world: IWorld, ...args: any[]) => void): System
    defineSerializer(target: IWorld | Component[] | IComponentProp[] | QueryModifier, maxBytes?: number): (target: IWorld | number[]) => ArrayBuffer
    defineDeserializer(target: IWorld | Component[] | IComponentProp[] | QueryModifier): (world: IWorld, packet: ArrayBuffer, mode: DESERIALIZE_MODE) => void
    pipe(...fns: ((...args: any[]) => any)[]): (...input: any[]) => any

    parentArray: Symbol
  }

  export function apply(world: IWorld): IAppliedAPI
}
