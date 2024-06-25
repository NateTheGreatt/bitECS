import { IUint32SparseSet } from '@bitecs/utils/Uint32SparseSet';

declare const $componentMap: unique symbol;
declare const $componentCount: unique symbol;
declare const $schema: unique symbol;

declare const TYPES_ENUM: {
    readonly i8: "i8";
    readonly ui8: "ui8";
    readonly ui8c: "ui8c";
    readonly i16: "i16";
    readonly ui16: "ui16";
    readonly i32: "i32";
    readonly ui32: "ui32";
    readonly f32: "f32";
    readonly f64: "f64";
    readonly eid: "eid";
};
declare const TYPES: {
    readonly i8: Int8ArrayConstructor;
    readonly ui8: Uint8ArrayConstructor;
    readonly ui8c: Uint8ClampedArrayConstructor;
    readonly i16: Int16ArrayConstructor;
    readonly ui16: Uint16ArrayConstructor;
    readonly i32: Int32ArrayConstructor;
    readonly ui32: Uint32ArrayConstructor;
    readonly f32: Float32ArrayConstructor;
    readonly f64: Float64ArrayConstructor;
    readonly eid: Uint32ArrayConstructor;
};

declare const SparseSet: () => {
    add: (val: number) => void;
    remove: (val: number) => void;
    has: (val: number) => boolean;
    sparse: number[];
    dense: number[];
    reset: () => void;
    sort: () => void;
};

declare const $modifier: unique symbol;
declare const $queries: unique symbol;
declare const $notQueries: unique symbol;
declare const $queriesHashMap: unique symbol;
declare const $querySparseSet: unique symbol;
declare const $queueRegisters: unique symbol;
declare const $queryDataMap: unique symbol;
declare const $dirtyQueries: unique symbol;
declare const $queryComponents: unique symbol;
declare const $enterQuery: unique symbol;
declare const $exitQuery: unique symbol;

type QueryModifier<W extends World = World> = (c: Component[]) => (world: W) => Component | QueryModifier<W>;
type QueryResult<W extends World = World, TTest = HasBufferQueries<W>> = TTest extends true ? Uint32Array : readonly number[];
type Query = (<W extends World = World>(world: W, clearDiff?: boolean) => QueryResult<W>) & {
    [$queryComponents]: Component[];
    [$queueRegisters]: ((world: World) => void)[];
};
type QueryData<TBufferQueries extends boolean = false | true> = (TBufferQueries extends true ? IUint32SparseSet : ReturnType<typeof SparseSet>) & {
    archetypes: any;
    changed: any;
    notComponents: any;
    changedComponents: any;
    allComponents: Component[];
    masks: any;
    notMasks: any;
    hasMasks: any;
    generations: any;
    flatProps: any;
    toRemove: ReturnType<typeof SparseSet>;
    enterQueues: ReturnType<typeof SparseSet>[];
    exitQueues: ReturnType<typeof SparseSet>[];
    shadows: any;
    query: Query;
};
type Queue<W extends World = World> = (world: W, drain?: boolean) => readonly number[];

type TODO = any;
type Constructor = new (...args: any[]) => any;
type TypedArray = Uint8Array | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;

declare const $storeRef: unique symbol;
declare const $storeSize: unique symbol;
declare const $storeMaps: unique symbol;
declare const $storeFlattened: unique symbol;
declare const $storeBase: unique symbol;
declare const $storeType: unique symbol;
declare const $storeArrayElementCounts: unique symbol;
declare const $storeSubarrays: unique symbol;
declare const $subarrayCursors: unique symbol;
declare const $subarray: unique symbol;
declare const $subarrayFrom: unique symbol;
declare const $subarrayTo: unique symbol;
declare const $parentArray: unique symbol;
declare const $tagStore: unique symbol;
declare const $queryShadow: unique symbol;
declare const $serializeShadow: unique symbol;
declare const $indexType: unique symbol;
declare const $indexBytes: unique symbol;
declare const $isEidType: unique symbol;

interface Metadata {
    [$storeSize]: number;
    [$storeMaps]: Record<string, unknown>;
    [$storeSubarrays]: Record<string, TypedArray>;
    [$storeRef]: symbol;
    [$subarrayCursors]: Record<string, number>;
    [$storeFlattened]: ArrayLike<any>[];
    [$storeArrayElementCounts]: Record<string, number>;
    [$storeBase]: () => Record<any, any>;
    [$tagStore]: boolean;
}
type ComponentType$1 = keyof typeof TYPES;
type ListType = readonly [ComponentType$1, number];
interface Schema {
    [key: string]: ComponentType$1 | ListType | Schema;
}

type Component = any;
interface ComponentNode {
    id: number;
    generationId: number;
    bitflag: number;
    ref: Component;
    queries: Set<QueryData>;
    notQueries: Set<QueryData>;
    changedQueries: Set<QueryData>;
}
type Types = keyof typeof TYPES;
type ArrayByType = {
    ['i8']: Int8Array;
    ['ui8']: Uint8Array;
    ['ui8c']: Uint8ClampedArray;
    ['i16']: Int16Array;
    ['ui16']: Uint16Array;
    ['i32']: Int32Array;
    ['ui32']: Uint32Array;
    ['f32']: Float32Array;
    ['f64']: Float64Array;
    ['eid']: Uint32Array;
};
type ComponentType<T extends Schema> = {
    [key in keyof T]: T[key] extends Types ? ArrayByType[T[key]] : T[key] extends [infer RT, number] ? RT extends Types ? Array<ArrayByType[RT]> : unknown : T[key] extends Schema ? ComponentType<T[key]> : unknown;
};
type ComponentProp = TypedArray | Array<TypedArray>;

declare const $entityMasks: unique symbol;
declare const $entityComponents: unique symbol;
declare const $entitySparseSet: unique symbol;
declare const $entityArray: unique symbol;
declare const $entityIndices: unique symbol;
declare const $removedEntities: unique symbol;

declare const $pairsMap: unique symbol;
declare const $isPairComponent: unique symbol;
declare const $relation: unique symbol;
declare const $pairTarget: unique symbol;
declare const $onTargetRemoved: unique symbol;
declare const $exclusiveRelation: unique symbol;
declare const $autoRemoveSubject: unique symbol;
declare const $relationTargetEntities: unique symbol;
declare const $initStore: unique symbol;

declare const $size: unique symbol;
declare const $bitflag: unique symbol;
declare const $archetypes: unique symbol;
declare const $localEntities: unique symbol;
declare const $localEntityLookup: unique symbol;
declare const $manualEntityRecycling: unique symbol;
declare const $bufferQueries: unique symbol;

interface World {
    [$size]: number;
    [$entityArray]: number[];
    [$entityMasks]: Array<number>[];
    [$entityComponents]: Map<number, Set<Component>>;
    [$archetypes]: any[];
    [$entitySparseSet]: ReturnType<typeof SparseSet>;
    [$bitflag]: number;
    [$componentMap]: Map<Component, ComponentNode>;
    [$componentCount]: number;
    [$queryDataMap]: Map<Query, QueryData>;
    [$queries]: Set<QueryData>;
    [$queriesHashMap]: Map<string, QueryData>;
    [$notQueries]: Set<any>;
    [$dirtyQueries]: Set<any>;
    [$localEntities]: Map<any, any>;
    [$localEntityLookup]: Map<any, any>;
    [$relationTargetEntities]: ReturnType<typeof SparseSet>;
    [$manualEntityRecycling]: boolean;
    [$bufferQueries]: boolean;
    _bufferQueries: boolean;
}
type HasBufferQueries<W extends World> = W extends {
    _bufferQueries: true;
} ? true : false;

declare const worlds: World[];
declare function defineWorld<W extends object = {}>(world: W, size?: number): W & World;
declare function defineWorld<W extends World = World>(size?: number): W;
declare function registerWorld(world: World): void;
/**
 * Creates a new world.
 *
 * @returns {object}
 */
declare function createWorld<W extends object = {}>(world?: W, size?: number): W & World;
declare function createWorld(size?: number): World;
/**
 * Resets a world.
 *
 * @param {World} world
 * @returns {object}
 */
declare const resetWorld: (world: World, size?: number) => World;
/**
 * Deletes a world.
 *
 * @param {World} world
 */
declare const deleteWorld: (world: World) => void;
/**
 * Returns all components registered to a world
 *
 * @param {World} world
 * @returns Array
 */
declare const getWorldComponents: (world: World) => any[];
/**
 * Returns all existing entities in a world
 *
 * @param {World} world
 * @returns Array
 */
declare const getAllEntities: (world: World) => number[];
declare const enableManualEntityRecycling: <W extends World>(world: W) => W;
declare const enableBufferedQueries: <W extends World>(world: W) => W & {
    _bufferQueries: true;
};

declare const resetGlobals: () => void;
declare const getDefaultSize: () => number;
/**
 * Sets the default maximum number of entities for worlds and component stores.
 *
 * @param {number} newSize
 */
declare const setDefaultSize: (newSize: number) => void;
/**
 * Sets the number of entities that must be removed before removed entity ids begin to be recycled.
 * This should be set to as a % (0-1) of `defaultSize` that you would never likely remove/add on a single frame.
 *
 * @param {number} newThreshold
 */
declare const setRemovedRecycleThreshold: (newThreshold: number) => void;
declare const flushRemovedEntities: (world: World) => void;
/**
 * Adds a new entity to the specified world.
 *
 * @param {World} world
 * @returns {number} eid
 */
declare const addEntity: (world: World) => number;
/**
 * Removes an existing entity from the specified world.
 *
 * @param {World} world
 * @param {number} eid
 */
declare const removeEntity: (world: World, eid: number) => void;
/**
 *  Returns an array of components that an entity possesses.
 *
 * @param {*} world
 * @param {*} eid
 */
declare const getEntityComponents: (world: World, eid: number) => TODO[];
/**
 * Checks the existence of an entity in a world
 *
 * @param {World} world
 * @param {number} eid
 */
declare const entityExists: (world: World, eid: number) => boolean;

/**
 * Defines a new component store.
 *
 * @param {object} schema
 * @returns {object}
 */
declare const defineComponent: <T extends Schema>(schema?: T, size?: number) => ComponentType<T>;
/**
 * Registers a component with a world.
 *
 * @param {World} world
 * @param {Component} component
 */
declare const registerComponent: (world: World, component: Component) => void;
/**
 * Registers multiple components with a world.
 *
 * @param {World} world
 * @param {Component[]} components
 */
declare const registerComponents: (world: World, components: Component[]) => void;
/**
 * Checks if an entity has a component.
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 * @returns {boolean}
 */
declare const hasComponent: (world: World, component: Component, eid: number) => boolean;
/**
 * Adds a component to an entity
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 * @param {boolean} [reset=false]
 */
declare const addComponent: (world: World, component: Component, eid: number, reset?: boolean) => void;
/**
 * Adds multiple components to an entity.
 *
 * @param {World} world
 * @param {Component[]} components
 * @param {number} eid
 * @param {boolean} [reset=false]
 */
declare const addComponents: (world: World, components: Component[], eid: number, reset?: boolean) => void;
/**
 * Removes a component from an entity.
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 * @param {boolean} [reset=true]
 */
declare const removeComponent: (world: World, component: Component, eid: number, reset?: boolean) => void;
/**
 * Removes multiple components from an entity.
 *
 * @param {World} world
 * @param {Component[]} components
 * @param {number} eid
 * @param {boolean} [reset=true]
 */
declare const removeComponents: (world: World, components: Component[], eid: number, reset?: boolean) => void;

type System<W extends World = World, R extends any[] = any[]> = (world: W, ...args: R) => W;

/**
 * Defines a new system function.
 *
 * @param {function} update
 * @returns {function}
 */
declare const defineSystem: <W extends World = World, R extends any[] = any[]>(update: (world: W, ...args: R) => void) => System<W, R>;

declare const Not: (c: Component) => QueryModifier;
declare const Changed: (c: Component) => QueryModifier;
declare const registerQuery: <W extends World>(world: W, query: Query) => void;
/**
 * Defines a query function which returns a matching set of entities when called on a world.
 *
 * @param {array} components
 * @returns {function} query
 */
declare const defineQuery: (components: Component[]) => Query;
declare function query<W extends World>(world: W, components: Component[]): QueryResult<W>;
declare function query<W extends World>(world: W, queue: Queue): QueryResult<W>;
declare const commitRemovals: (world: World) => void;
/**
 * Resets a Changed-based query, clearing the underlying list of changed entities.
 *
 * @param {World} world
 * @param {function} query
 */
declare const resetChangedQuery: (world: World, query: TODO) => void;
/**
 * Removes a query from a world.
 *
 * @param {World} world
 * @param {function} query
 */
declare const removeQuery: (world: World, query: Query) => void;
/**
 * Given an existing query, returns a new function which returns entities who have been added to the given query since the last call of the function.
 *
 * @param {function} query
 * @returns {function} enteredQuery
 */
declare const enterQuery: (query: Query) => (world: World) => readonly number[];
/**
 * Given an existing query, returns a new function which returns entities who have been removed from the given query since the last call of the function.
 *
 * @param {function} query
 * @returns {function} enteredQuery
 */
declare const exitQuery: (query: Query) => (world: World) => readonly number[];

declare const archetypeHash: (world: World, components: Component[]) => any;

declare function defineEnterQueue(query: Query): Queue;
declare function defineEnterQueue(components: Component[]): Queue;
declare function defineExitQueue(query: Query): Queue;
declare function defineExitQueue(components: Component[]): Queue;

type Serializer<W extends World = World> = (target: W | number[]) => ArrayBuffer;
type Deserializer<W extends World = World> = (world: W, packet: ArrayBuffer, mode?: (typeof DESERIALIZE_MODE)[keyof typeof DESERIALIZE_MODE]) => number[];

declare const DESERIALIZE_MODE: {
    readonly REPLACE: 0;
    readonly APPEND: 1;
    readonly MAP: 2;
};
/**
 * Defines a new serializer which targets the given components to serialize the data of when called on a world or array of EIDs.
 *
 * @param {object|array} target
 * @param {number} [maxBytes=20000000]
 * @returns {function} serializer
 */
declare const defineSerializer: (target: TODO, maxBytes?: number) => Serializer;
/**
 * Defines a new deserializer which targets the given components to deserialize onto a given world.
 *
 * @param {object|array} target
 * @returns {function} deserializer
 */
declare const defineDeserializer: (target: TODO) => Deserializer;

declare const parentArray: (store: TODO) => any;

declare const pipe: (...fns: Function[]) => (input: any) => any;

declare const $prefabComponents: unique symbol;
declare const $worldToPrefab: unique symbol;

type PrefabToken = {
    [$prefabComponents]: Component[];
    [$worldToPrefab]: Map<World, number>;
};

type OnTargetRemovedCallback = (world: World, subject: number, target: number) => void;
type RelationTarget = number | string | PrefabToken;
type RelationType<T> = T & {
    [$pairsMap]: Map<number | string, T>;
    [$initStore]: () => T;
    [$exclusiveRelation]: boolean;
    [$autoRemoveSubject]: boolean;
    [$onTargetRemoved]: OnTargetRemovedCallback;
} & ((target: RelationTarget) => T);

declare const defineRelation: <T>(options?: {
    initStore?: () => T;
    exclusive?: boolean;
    autoRemoveSubject?: boolean;
    onTargetRemoved?: OnTargetRemovedCallback;
}) => RelationType<T>;
declare const Pair: <T>(relation: RelationType<T>, target: RelationTarget) => T;
declare const Wildcard: RelationType<any> | string;
declare const IsA: RelationType<any>;
declare const getRelationTargets: (world: World, relation: RelationType<any>, eid: number) => any[];

declare const definePrefab: (components?: Component[]) => PrefabToken;
declare const registerPrefab: (world: World, prefab: PrefabToken) => number;
declare const registerPrefabs: (world: World, prefabs: PrefabToken[]) => number[];
declare const addPrefab: (world: World) => number;

declare const SYMBOLS: {
    $prefabComponents: typeof $prefabComponents;
    $worldToPrefab: typeof $worldToPrefab;
    $pairsMap: typeof $pairsMap;
    $isPairComponent: typeof $isPairComponent;
    $relation: typeof $relation;
    $pairTarget: typeof $pairTarget;
    $onTargetRemoved: typeof $onTargetRemoved;
    $exclusiveRelation: typeof $exclusiveRelation;
    $autoRemoveSubject: typeof $autoRemoveSubject;
    $relationTargetEntities: typeof $relationTargetEntities;
    $initStore: typeof $initStore;
    $storeRef: typeof $storeRef;
    $storeSize: typeof $storeSize;
    $storeMaps: typeof $storeMaps;
    $storeFlattened: typeof $storeFlattened;
    $storeBase: typeof $storeBase;
    $storeType: typeof $storeType;
    $storeArrayElementCounts: typeof $storeArrayElementCounts;
    $storeSubarrays: typeof $storeSubarrays;
    $subarrayCursors: typeof $subarrayCursors;
    $subarray: typeof $subarray;
    $subarrayFrom: typeof $subarrayFrom;
    $subarrayTo: typeof $subarrayTo;
    $parentArray: typeof $parentArray;
    $tagStore: typeof $tagStore;
    $queryShadow: typeof $queryShadow;
    $serializeShadow: typeof $serializeShadow;
    $indexType: typeof $indexType;
    $indexBytes: typeof $indexBytes;
    $isEidType: typeof $isEidType;
    $modifier: typeof $modifier;
    $queries: typeof $queries;
    $notQueries: typeof $notQueries;
    $queriesHashMap: typeof $queriesHashMap;
    $querySparseSet: typeof $querySparseSet;
    $queueRegisters: typeof $queueRegisters;
    $queryDataMap: typeof $queryDataMap;
    $dirtyQueries: typeof $dirtyQueries;
    $queryComponents: typeof $queryComponents;
    $enterQuery: typeof $enterQuery;
    $exitQuery: typeof $exitQuery;
    $componentMap: typeof $componentMap;
    $componentCount: typeof $componentCount;
    $schema: typeof $schema;
    $entityMasks: typeof $entityMasks;
    $entityComponents: typeof $entityComponents;
    $entitySparseSet: typeof $entitySparseSet;
    $entityArray: typeof $entityArray;
    $entityIndices: typeof $entityIndices;
    $removedEntities: typeof $removedEntities;
    $size: typeof $size;
    $bitflag: typeof $bitflag;
    $archetypes: typeof $archetypes;
    $localEntities: typeof $localEntities;
    $localEntityLookup: typeof $localEntityLookup;
    $manualEntityRecycling: typeof $manualEntityRecycling;
    $bufferQueries: typeof $bufferQueries;
};

export { type ArrayByType, Changed, type Component, type ComponentNode, type ComponentProp, type ComponentType, type Constructor, DESERIALIZE_MODE, type Deserializer, type HasBufferQueries, IsA, type ListType, type Metadata, Not, type OnTargetRemovedCallback, Pair, type PrefabToken, type Query, type QueryData, type QueryModifier, type QueryResult, type Queue, type RelationTarget, type RelationType, SYMBOLS, type Schema, type Serializer, type System, type TODO, type TypedArray, TYPES_ENUM as Types, Wildcard, type World, addComponent, addComponents, addEntity, addPrefab, archetypeHash, commitRemovals, createWorld, defineComponent, defineDeserializer, defineEnterQueue, defineExitQueue, definePrefab, defineQuery, defineRelation, defineSerializer, defineSystem, defineWorld, deleteWorld, enableBufferedQueries, enableManualEntityRecycling, enterQuery, entityExists, exitQuery, flushRemovedEntities, getAllEntities, getDefaultSize, getEntityComponents, getRelationTargets, getWorldComponents, hasComponent, parentArray, pipe, query, registerComponent, registerComponents, registerPrefab, registerPrefabs, registerQuery, registerWorld, removeComponent, removeComponents, removeEntity, removeQuery, resetChangedQuery, resetGlobals, resetWorld, setDefaultSize, setRemovedRecycleThreshold, worlds };
