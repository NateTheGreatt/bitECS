import {
  $dirtyQueries,
  $notQueries,
  $queries,
  $queryMap,
} from "../query/symbols";
import {
  $entityArray,
  $entityComponents,
  $entityMasks,
  $entitySparseSet,
} from "../entity/symbols";
import { SparseSet } from "../utils/SparseSet";
import {
  $archetypes,
  $bitflag,
  $localEntities,
  $localEntityLookup,
  $manualEntityRecycling,
  $resizeThreshold,
  $size,
} from "./symbols";
import { TODO } from "../utils/types";
import { $componentMap } from "../component/symbols";

export interface World {
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
