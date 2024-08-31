declare module "utils/SparseSet" {
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
declare module "utils/defineHiddenProperty" {
    export const defineHiddenProperty: (obj: any, key: any, value: any) => any;
    export const defineHiddenProperties: (obj: any, kv: any) => void;
}
declare module "EntityIndex" {
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
declare module "World" {
    import { EntityIndex } from "EntityIndex";
    import { ComponentRef, ComponentData } from "Component";
    import { Query } from "Query";
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
declare module "utils/Observer" {
    export type Observer = (entity: number, ...args: any[]) => void;
    export interface Observable {
        subscribe: (observer: Observer) => () => void;
        notify: (entity: number, ...args: any[]) => void;
    }
    export const createObservable: () => Observable;
}
declare module "Query" {
    import { type SparseSet } from "utils/SparseSet";
    import { ComponentRef, ComponentData } from "Component";
    import { World } from "World";
    import { createObservable } from "utils/Observer";
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
declare module "utils/pipe" {
    type Func = (...args: any) => any;
    export const pipe: <T extends Func, U extends Func, R extends Func>(...functions: [T, ...U[], R]) => (...args: Parameters<T>) => ReturnType<R>;
}
declare module "index" {
    export { createWorld, resetWorld, getWorldComponents, getAllEntities, $internal, } from "World";
    export type { World, InternalWorld, WorldContext } from "World";
    export { addEntity, removeEntity, getEntityComponents, entityExists, Prefab, } from "Entity";
    export { registerComponent, registerComponents, hasComponent, addComponent, addComponents, removeComponent, removeComponents, } from "Component";
    export type { ComponentRef, ComponentData } from "Component";
    export { commitRemovals, removeQuery, registerQuery, innerQuery, query, observe, onAdd, onRemove, ObservableHook, QueryResult, Query, QueryOperatorType, OpReturnType, QueryOperator, QueryTerm, OrOp, AndOp, NotOp, AnyOp, AllOp, NoneOp, Or, And, Not, Any, All, None } from "Query";
    export { pipe } from "utils/pipe";
    export * from "Relation";
    export { createEntityIndex } from "EntityIndex";
}
declare module "Relation" {
    import { World } from "index";
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
declare module "Entity" {
    import { World } from "World";
    import { ComponentRef } from "Component";
    export const Prefab: {};
    export const addPrefab: (world: World) => number;
    export const addEntity: (world: World) => number;
    export const removeEntity: (world: World, eid: number) => void;
    export const getEntityComponents: (world: World, eid: number) => ComponentRef[];
    export const entityExists: (world: World, eid: number) => boolean;
}
declare module "Component" {
    import { Query } from "Query";
    import { Observable } from "utils/Observer";
    import { World } from "World";
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
//# sourceMappingURL=index.d.ts.map