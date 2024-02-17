import { TYPES } from "../constants/Constants";
import { TypedArray } from "../utils/types";
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
