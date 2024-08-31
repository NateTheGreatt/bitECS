declare module "core/utils/defineHiddenProperty" {
    export const defineHiddenProperty: (obj: any, key: any, value: any) => any;
    export const defineHiddenProperties: (obj: any, kv: any) => void;
}
declare module "core/EntityIndex" {
    export type EntityIndex = {
        aliveCount: number;
        dense: number[];
        sparse: number[];
        maxId: number;
    };
    export const createEntityIndex: () => EntityIndex;
    export const addEntityId: (index: EntityIndex) => number;
    export const removeEntityId: (index: EntityIndex, id: number) => void;
    export const isEntityIdAlive: (index: EntityIndex, id: number) => boolean;
}
declare module "core/utils/SparseSet" {
    export type SparseSet = {
        add: (val: number) => void;
        remove: (val: number) => void;
        has: (val: number) => boolean;
        sparse: number[];
        dense: number[] | Uint32Array;
        reset: () => void;
    };
    export const createSparseSet: () => {
        add: (val: number) => void;
        remove: (val: number) => void;
        has: (val: number) => boolean;
        sparse: number[];
        dense: number[];
        reset: () => void;
    };
    export const createUint32SparseSet: (initialCapacity?: number) => SparseSet;
}
declare module "core/utils/Observer" {
    export type Observer = (entity: number, ...args: any[]) => void;
    export interface Observable {
        subscribe: (observer: Observer) => () => void;
        notify: (entity: number, ...args: any[]) => void;
    }
    export const createObservable: () => Observable;
}
declare module "core/Query" {
    import { type SparseSet } from "core/utils/SparseSet";
    import { ComponentRef, ComponentData } from "core/Component";
    import { World } from "core/World";
    import { createObservable } from "core/utils/Observer";
    export type QueryResult = Uint32Array | readonly number[];
    export type Query = SparseSet & {
        allComponents: ComponentRef[];
        orComponents: ComponentRef[];
        notComponents: ComponentRef[];
        masks: {
            [key: number]: number;
        };
        orMasks: {
            [key: number]: number;
        };
        notMasks: {
            [key: number]: number;
        };
        hasMasks: {
            [key: number]: number;
        };
        generations: number[];
        toRemove: SparseSet;
        addObservable: ReturnType<typeof createObservable>;
        removeObservable: ReturnType<typeof createObservable>;
    };
    export type QueryOperatorType = 'Or' | 'And' | 'Not';
    export type OpReturnType = {
        type: QueryOperatorType;
        components: ComponentRef[];
    };
    export type QueryOperator = (...components: ComponentRef[]) => OpReturnType;
    export type QueryTerm = ComponentRef | QueryOperator;
    export type OrOp = QueryOperator;
    export type AndOp = QueryOperator;
    export type NotOp = QueryOperator;
    export type AnyOp = OrOp;
    export type AllOp = AndOp;
    export type NoneOp = NotOp;
    export type ObservableHook = (...components: ComponentRef[]) => {
        type: 'add' | 'remove' | 'set';
        components: ComponentRef[];
    };
    export const onAdd: ObservableHook;
    export const onRemove: ObservableHook;
    export const onSet: ObservableHook;
    export const set: <T>(world: World, eid: number, component: ComponentRef, params: T) => void;
    export const observe: (world: World, hook: ReturnType<typeof onAdd | typeof onRemove>, callback: (eid: number) => void) => () => void;
    export const Or: OrOp;
    export const And: AndOp;
    export const Not: NotOp;
    export const Any: AnyOp;
    export const All: AllOp;
    export const None: NoneOp;
    export const queryHash: (world: World, terms: QueryTerm[]) => string;
    export const registerQuery: (world: World, terms: QueryTerm[], options?: {
        buffered?: boolean;
    }) => Query;
    export function innerQuery(world: World, terms: QueryTerm[], options?: {
        buffered?: boolean;
    }): QueryResult;
    export function query(world: World, terms: QueryTerm[]): readonly number[];
    export function bufferQuery(world: World, terms: QueryTerm[]): Uint32Array;
    export function queryCheckEntity(world: World, query: Query, eid: number): boolean;
    export const queryCheckComponent: (query: Query, c: ComponentData) => boolean;
    export const queryAddEntity: (query: Query, eid: number) => void;
    export const commitRemovals: (world: World) => void;
    export const queryRemoveEntity: (world: World, query: Query, eid: number) => void;
    export const removeQuery: (world: World, terms: QueryTerm[]) => void;
}
declare module "core/Relation" {
    import { World } from "core/index";
    export type OnTargetRemovedCallback = (subject: number, target: number | string) => void;
    export type RelationTarget = number | '*' | typeof Wildcard;
    export const $relation: unique symbol;
    export const $pairTarget: unique symbol;
    export const $isPairComponent: unique symbol;
    export const $relationData: unique symbol;
    export type Relation<T> = (target: RelationTarget) => T;
    export const withStore: <T>(createStore: () => T) => (relation: Relation<T>) => Relation<T>;
    export const makeExclusive: <T>(relation: Relation<T>) => Relation<T>;
    export const withAutoRemove: <T>(relation: Relation<T>) => Relation<T>;
    export const withOnRemove: <T>(onRemove: OnTargetRemovedCallback) => (relation: Relation<T>) => Relation<T>;
    export const Pair: <T>(relation: Relation<T>, target: RelationTarget) => T;
    export const Wildcard: Relation<any>;
    export const IsA: Relation<any>;
    export const getRelationTargets: (world: World, relation: Relation<any>, eid: number) => any[];
    export function createRelation<T>(...modifiers: Array<(relation: Relation<T>) => Relation<T>>): Relation<T>;
    export function createRelation<T>(options: {
        store?: () => T;
        exclusive?: boolean;
        autoRemoveSubject?: boolean;
        onTargetRemoved?: OnTargetRemovedCallback;
    }): Relation<T>;
}
declare module "core/Entity" {
    import { World } from "core/World";
    import { ComponentRef } from "core/Component";
    export const Prefab: {};
    export const addPrefab: (world: World) => number;
    export const addEntity: (world: World) => number;
    export const removeEntity: (world: World, eid: number) => void;
    export const getEntityComponents: (world: World, eid: number) => ComponentRef[];
    export const entityExists: (world: World, eid: number) => boolean;
}
declare module "core/Component" {
    import { Query } from "core/Query";
    import { Observable } from "core/utils/Observer";
    import { World } from "core/World";
    export type ComponentRef = any;
    export interface ComponentData {
        id: number;
        generationId: number;
        bitflag: number;
        ref: ComponentRef;
        queries: Set<Query>;
        setObservable: Observable;
    }
    export const registerComponent: (world: World, component: ComponentRef) => ComponentData;
    export const registerComponents: (world: World, components: ComponentRef[]) => void;
    export const hasComponent: (world: World, component: ComponentRef, eid: number) => boolean;
    export const addComponent: (world: World, component: ComponentRef, eid: number) => void;
    export const addComponents: (world: World, components: ComponentRef[], eid: number) => void;
    export const removeComponent: (world: World, component: ComponentRef, eid: number) => void;
    export const removeComponents: (world: World, components: ComponentRef[], eid: number) => void;
}
declare module "core/World" {
    import { EntityIndex } from "core/EntityIndex";
    import { ComponentRef, ComponentData } from "core/Component";
    import { Query } from "core/Query";
    export const $internal: unique symbol;
    export type WorldContext = {
        entityIndex: EntityIndex;
        entityMasks: number[][];
        entityComponents: Map<number, Set<ComponentRef>>;
        bitflag: number;
        componentMap: WeakMap<ComponentRef, ComponentData>;
        componentCount: number;
        queries: Set<Query>;
        queriesHashMap: Map<string, Query>;
        notQueries: Set<any>;
        dirtyQueries: Set<any>;
    };
    export type InternalWorld = {
        [$internal]: WorldContext;
    };
    export type World<T extends object = {}> = T;
    type WorldModifier<T> = (world: World) => World & T;
    export const withEntityIndex: (entityIndex: EntityIndex) => WorldModifier<{}>;
    export const withContext: <T extends object>(context: T) => WorldModifier<T>;
    export const createWorld: <T extends object = {}>(...args: (WorldModifier<any> | {
        entityIndex?: EntityIndex;
        context?: T;
    })[]) => T;
    export const resetWorld: (world: World) => {};
    export const getWorldComponents: (world: World) => string[];
    export const getAllEntities: (world: World) => number[];
}
declare module "core/utils/pipe" {
    type Func = (...args: any) => any;
    export const pipe: <T extends Func, U extends Func, R extends Func>(...functions: [T, ...U[], R]) => (...args: Parameters<T>) => ReturnType<R>;
}
declare module "core/index" {
    export { createWorld, resetWorld, getWorldComponents, getAllEntities, $internal, } from "core/World";
    export type { World, InternalWorld, WorldContext } from "core/World";
    export { addEntity, removeEntity, getEntityComponents, entityExists, Prefab, } from "core/Entity";
    export { registerComponent, registerComponents, hasComponent, addComponent, addComponents, removeComponent, removeComponents, } from "core/Component";
    export type { ComponentRef, ComponentData } from "core/Component";
    export { commitRemovals, removeQuery, registerQuery, innerQuery, query, observe, onAdd, onRemove, ObservableHook, QueryResult, Query, QueryOperatorType, OpReturnType, QueryOperator, QueryTerm, OrOp, AndOp, NotOp, AnyOp, AllOp, NoneOp, Or, And, Not, Any, All, None } from "core/Query";
    export { pipe } from "core/utils/pipe";
    export * from "core/Relation";
    export { createEntityIndex } from "core/EntityIndex";
}
declare module "serialization/ObserverSerializer" {
    import { World } from "core/index";
    export const createObserverSerializer: (world: World, networkedTag: any, components: any[], buffer?: ArrayBuffer) => () => ArrayBuffer;
    export const createObserverDeserializer: (world: World, networkedTag: any, components: any[]) => (packet: ArrayBuffer, entityIdMapping?: Map<number, number>) => Map<number, number>;
}
declare module "serialization/SoASerializer" {
    const $u8: unique symbol, $i8: unique symbol, $u16: unique symbol, $i16: unique symbol, $u32: unique symbol, $i32: unique symbol, $f32: unique symbol, $f64: unique symbol;
    export type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
    export type TypeSymbol = typeof $u8 | typeof $i8 | typeof $u16 | typeof $i16 | typeof $u32 | typeof $i32 | typeof $f32 | typeof $f64;
    export type PrimitiveBrand = (number[] & {
        [key: symbol]: true;
    }) | TypedArray;
    export const u8: (a?: number[]) => PrimitiveBrand, i8: (a?: number[]) => PrimitiveBrand, u16: (a?: number[]) => PrimitiveBrand, i16: (a?: number[]) => PrimitiveBrand, u32: (a?: number[]) => PrimitiveBrand, i32: (a?: number[]) => PrimitiveBrand, f32: (a?: number[]) => PrimitiveBrand, f64: (a?: number[]) => PrimitiveBrand;
    export const createComponentSerializer: (component: Record<string, PrimitiveBrand>) => (view: DataView, offset: number, index: number) => number;
    export const createComponentDeserializer: (component: Record<string, PrimitiveBrand>) => (view: DataView, offset: number, entityIdMapping?: Map<number, number>) => number;
    export const createSoASerializer: (components: Record<string, PrimitiveBrand>[], buffer?: ArrayBuffer) => (indices: number[]) => ArrayBuffer;
    export const createSoADeserializer: (components: Record<string, PrimitiveBrand>[]) => (packet: ArrayBuffer, entityIdMapping?: Map<number, number>) => void;
}
declare module "serialization/SnapshotSerializer" {
    import { PrimitiveBrand } from "serialization/SoASerializer";
    import { World } from "core/index";
    export const createSnapshotSerializer: (world: World, components: Record<string, PrimitiveBrand>[], buffer?: ArrayBuffer) => () => ArrayBuffer;
    export const createSnapshotDeserializer: (world: World, components: Record<string, PrimitiveBrand>[]) => (packet: ArrayBuffer) => Map<number, number>;
}
declare module "serialization/index" {
    export { createSoASerializer, createSoADeserializer, u8, i8, u16, i16, u32, i32, f32, f64, type PrimitiveBrand } from "serialization/SoASerializer";
    export { createSnapshotSerializer, createSnapshotDeserializer } from "serialization/SnapshotSerializer";
    export { createObserverSerializer, createObserverDeserializer } from "serialization/ObserverSerializer";
}
//# sourceMappingURL=index.d.ts.map