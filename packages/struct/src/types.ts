import { TYPES } from "./constants";
import {
  $storeArrayElementCounts,
  $storeBase,
  $storeFlattened,
  $storeMaps,
  $storeRef,
  $storeSize,
  $storeSubarrays,
  $subarrayCursors,
  $tagStore,
} from "./symbols";

export interface Metadata {
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

type ComponentType = keyof typeof TYPES;

export type ListType = readonly [ComponentType, number];

export interface Schema {
  [key: string]: ComponentType | ListType | Schema;
}

export type TODO = any;

export type Constructor = new (...args: any[]) => any;

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
