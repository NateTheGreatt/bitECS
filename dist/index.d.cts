declare const $queries: unique symbol;
declare const $notQueries: unique symbol;
declare const $queryAny: unique symbol;
declare const $queryAll: unique symbol;
declare const $queryNone: unique symbol;
declare const $queryMap: unique symbol;
declare const $dirtyQueries: unique symbol;
declare const $queryComponents: unique symbol;

declare const $entityMasks: unique symbol;
declare const $entityComponents: unique symbol;
declare const $entitySparseSet: unique symbol;
declare const $entityArray: unique symbol;

declare const SparseSet: () => {
    add: (val: number) => void;
    remove: (val: number) => void;
    has: (val: number) => boolean;
    sparse: number[];
    dense: number[];
    reset: () => void;
};

declare const $size: unique symbol;
declare const $resizeThreshold: unique symbol;
declare const $bitflag: unique symbol;
declare const $archetypes: unique symbol;
declare const $localEntities: unique symbol;
declare const $localEntityLookup: unique symbol;
declare const $manualEntityRecycling: unique symbol;

type TODO = any;
type TypedArray = Uint8Array | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;

declare const $componentMap: unique symbol;

interface World {
    [key: string]: any;
    [$size]: number;
    [$entityArray]: number[];
    [$entityMasks]: Uint32Array[];
    [$entityComponents]: Map<number, Set<TODO>>;
    [$archetypes]: any[];
    [$entitySparseSet]: ReturnType<typeof SparseSet>;
    [$bitflag]: number;
    [$componentMap]: Map<any, any>;
    [$queryMap]: Map<any, any>;
    [$queries]: Set<any>;
    [$notQueries]: Set<any>;
    [$dirtyQueries]: Set<any>;
    [$localEntities]: Map<any, any>;
    [$localEntityLookup]: Map<any, any>;
    [$manualEntityRecycling]: boolean;
    [$resizeThreshold]: number;
}

declare function createWorld<W extends World = World>(world?: W, size?: number): W;
declare function createWorld<W extends World = World>(size?: number): W;
declare const enableManualEntityRecycling: (world: World) => void;
declare const resetWorld: (world: World, size?: number) => World;
declare const deleteWorld: (world: World) => void;
declare const getWorldComponents: (world: World) => any[];
declare const getAllEntities: (world: World) => number[];

declare const resetGlobals: () => void;
declare const getDefaultSize: () => number;
declare const setDefaultSize: (newSize: number) => void;
declare const setRemovedRecycleThreshold: (newThreshold: number) => void;
declare const flushRemovedEntities: (world: World) => void;
declare const addEntity: (world: World) => number;
declare const removeEntity: (world: World, eid: number) => void;
declare const getEntityComponents: (world: World, eid: number) => TODO[];
declare const entityExists: (world: World, eid: number) => boolean;

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

type ComponentType$1 = keyof typeof TYPES;
type ListType = readonly [ComponentType$1, number];
interface Schema {
    [key: string]: ComponentType$1 | ListType | Schema;
}

interface Component {
}
type Types$1 = keyof typeof TYPES;
type ArrayByType = {
    ["i8"]: Int8Array;
    ["ui8"]: Uint8Array;
    ["ui8c"]: Uint8ClampedArray;
    ["i16"]: Int16Array;
    ["ui16"]: Uint16Array;
    ["i32"]: Int32Array;
    ["ui32"]: Uint32Array;
    ["f32"]: Float32Array;
    ["f64"]: Float64Array;
    ["eid"]: Uint32Array;
};
type ComponentType<T extends Schema> = {
    [key in keyof T]: T[key] extends Types$1 ? ArrayByType[T[key]] : T[key] extends [infer RT, number] ? RT extends Types$1 ? Array<ArrayByType[RT]> : unknown : T[key] extends Schema ? ComponentType<T[key]> : unknown;
};
type ComponentProp = TypedArray | Array<TypedArray>;

declare const defineComponent: <T extends Schema>(schema?: T, size?: number) => ComponentType<T>;
declare const registerComponent: (world: World, component: Component) => void;
declare const registerComponents: (world: World, components: Component[]) => void;
declare const hasComponent: (world: World, component: Component, eid: number) => boolean;
declare const addComponent: (world: World, component: Component, eid: number, reset?: boolean) => void;
declare const removeComponent: (world: World, component: Component, eid: number, reset?: boolean) => void;

declare const defineSystem: <W extends World = World, R extends any[] = any[]>(update: (world: W, ...args: R) => W) => System<W, R>;
type System<W extends World = World, R extends any[] = any[]> = (world: W, ...args: R) => W;

type QueryModifier<W extends World = World> = (c: (Component | ComponentProp)[]) => (world: W) => Component | QueryModifier<W>;
type Query<W extends World = World> = (world: W, clearDiff?: boolean) => number[];

declare const Not: (c: Component) => QueryModifier;
declare const Changed: (c: Component) => QueryModifier;
declare const enterQuery: (query: Query) => (world: World) => any;
declare const exitQuery: (query: Query) => (world: World) => any;
declare const defineQuery: (...args: TODO) => ((world: World) => any) | {
    (world: World, clearDiff?: boolean): any;
    [$queryComponents]: any;
    [$queryAny]: undefined;
    [$queryAll]: undefined;
    [$queryNone]: undefined;
};
declare const commitRemovals: (world: World) => void;
declare const resetChangedQuery: (world: World, query: TODO) => void;
declare const removeQuery: (world: World, query: Query) => void;

type Serializer<W extends World = World> = (target: W | number[]) => ArrayBuffer;
type Deserializer<W extends World = World> = (world: W, packet: ArrayBuffer, mode?: (typeof DESERIALIZE_MODE)[keyof typeof DESERIALIZE_MODE]) => number[];

declare const DESERIALIZE_MODE: {
    readonly REPLACE: 0;
    readonly APPEND: 1;
    readonly MAP: 2;
};
declare const defineSerializer: (target: TODO, maxBytes?: number) => Serializer;
declare const defineDeserializer: (target: TODO) => Deserializer;

declare const parentArray: (store: TODO) => any;

declare const pipe: (...fns: Function[]) => (input: any) => any;

declare const Types: {
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

export { Changed, DESERIALIZE_MODE, Not, Types, addComponent, addEntity, commitRemovals, createWorld, defineComponent, defineDeserializer, defineQuery, defineSerializer, defineSystem, deleteWorld, enableManualEntityRecycling, enterQuery, entityExists, exitQuery, flushRemovedEntities, getAllEntities, getDefaultSize, getEntityComponents, getWorldComponents, hasComponent, parentArray, pipe, registerComponent, registerComponents, removeComponent, removeEntity, removeQuery, resetChangedQuery, resetGlobals, resetWorld, setDefaultSize, setRemovedRecycleThreshold };
