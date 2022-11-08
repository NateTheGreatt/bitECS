import { $componentMap } from "./Component";
import { TYPES, TYPES_ENUM, TYPES_NAMES } from "./Constants";
import {
  $entityArray,
  $entityComponents,
  $entityMasks,
  $entitySparseSet,
} from "./Entity";
import {
  $dirtyQueries,
  $notQueries,
  $queries,
  $queryAll,
  $queryAny,
  $queryComponents,
  $queryMap,
  $queryNone,
} from "./Query";
import {
  $indexBytes,
  $indexType,
  $isEidType,
  $parentArray,
  $storeArrayElementCounts,
  $storeBase,
  $storeFlattened,
  $storeMaps,
  $storeRef,
  $storeSize,
  $storeSubarrays,
  $storeType,
  $subarray,
  $subarrayCursors,
  $tagStore,
} from "./Storage";
import { SparseSet } from "./Util";
import {
  $archetypes,
  $bitflag,
  $localEntities,
  $localEntityLookup,
  $resizeThreshold,
  $size,
} from "./World";

export type World<T = object> = {
  [$size]: number;
  [$archetypes]: unknown[];
  [$bitflag]: number;
  [$resizeThreshold]: number;

  // Entities
  [$componentMap]: Map<Component, RegisteredComponent>;
  [$entityArray]: number[];
  [$entityComponents]: Map<number, Set<Component>>;
  [$entityMasks]: Uint32Array[];
  [$entitySparseSet]: ReturnType<typeof SparseSet>;

  // Queries
  [$dirtyQueries]: Set<Query>;
  [$notQueries]: Set<unknown>;
  [$queryMap]: Map<QueryFunction, Query>;
  [$queries]: Set<unknown>;

  // Local Entities
  [$localEntities]: Map<unknown, unknown>;
  [$localEntityLookup]: Map<unknown, unknown>;
} & {
  [K in keyof T]: T[K];
};

export type SystemUpdate<TWorld extends World> = (
  world: TWorld,
  ...args: any[]
) => void;

export type StoreType = typeof TYPES;
export type StoreTypeName = typeof TYPES_NAMES;

export interface StorageMetadata {
  [$storeSize]: number;
  [$storeMaps]: unknown;
  [$storeSubarrays]: {
    [K in keyof StoreType]?: TypedArrayWithSymbols;
  };
  [$storeRef]: symbol;
  [$subarrayCursors]: {
    [K in keyof StoreType]: number;
  };
  [$storeFlattened]: (TypeStore | ArrayStore)[];
  [$storeArrayElementCounts]: Record<keyof StoreType, number>;
}

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
  | Float64Array;

export type TypedArrayWithSymbols = TypedArray & {
  [$indexType]: StoreTypeName["ui8" | "ui16" | "ui32"];
  [$indexBytes]: number;
  [$subarray]: boolean;
};

export type ComponentStore<
  TComponent extends ComponentSchema = ComponentSchema
> = StorageMetadata &
  Store<TComponent> & {
    [$storeBase]: () => Store<TComponent>;
  };

export type TagStore = {
  [$storeSize]: number;
  [$tagStore]: true;
  [$storeBase]: () => TagStore;
};

export type Store<TComponent extends ComponentSchema = ComponentSchema> = {
  [K in keyof TComponent]: TComponent[K] extends keyof StoreType // is string
    ? TypeStore
    : TComponent[K] extends [string, number][] // if array
    ? ArrayStore
    : TComponent[K] extends object // if object
    ? ComponentStore<TComponent[K]>
    : TComponent[K];
};

export type ArrayStore = TypedArrayWithSymbols[] & {
  [$storeType]: keyof StoreType;
  [$isEidType]: boolean;
  [$parentArray]: TypedArray;
};

export type TypeStore = TypedArray & {
  [$isEidType]: boolean;
};

export interface ComponentSchema {
  [k: string | symbol]: TYPES_ENUM | ComponentSchema;
}

export type Component<T extends ComponentSchema = ComponentSchema> = Store<T>;

export type RegisteredComponent<TComponent extends Component = Component> = {
  generationId: number;
  bitflag: number;
  store: TComponent;
  queries: Set<Query>;
  notQueries: unknown;
  changedQueries: unknown;
};

export type Query = ReturnType<typeof SparseSet> & {
  archetypes: unknown[];
  changed: number[];
  components: Store[];
  notComponents: Store[];
  changedComponents: Store[];
  allComponents: RegisteredComponent[];
  masks: Record<number, number>;
  notMasks: Record<number, number>;
  hasMasks: Record<number, number>;
  generations: number[];
  flatProps: (TypeStore | ArrayStore)[];
  toRemove: ReturnType<typeof SparseSet>;
  entered: ReturnType<typeof SparseSet>;
  exited: ReturnType<typeof SparseSet>;
  shadows: unknown[];
};

export type UserQueryFunction<TWorld extends World> = (
  world: TWorld,
  clearDiff?: boolean
) => number[];

export type QueryFunction<TWorld extends World = World> =
  UserQueryFunction<TWorld> & {
    [$queryComponents]: (Component | (() => [Component, "not" | "changed"]))[];
    [$queryAny]: unknown;
    [$queryAll]: unknown;
    [$queryNone]: unknown;
  };
