import {
	$dirtyQueries,
	$notQueries,
	$queries,
	$queriesHashMap,
	$queryDataMap,
} from '../query/symbols';
import { $entityArray, $entityComponents, $entityMasks, $entitySparseSet } from '../entity/symbols';
import {
	$archetypes,
	$bitflag,
	$localEntities,
	$localEntityLookup,
	$manualEntityRecycling,
	$resizeThreshold,
	$size,
} from './symbols';
import { $componentCount, $componentMap } from '../component/symbols';
import { Query, QueryData } from '../query/types';
import { Component, ComponentNode } from '../component/types';
import { SparseSet } from '../utils/SparseSet';
import { $relationTargetEntities } from '../relation/symbols';

export interface World {
	[$size]: number;
	[$entityArray]: number[];
	[$entityMasks]: Uint32Array[];
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
	[$manualEntityRecycling]: boolean;
	[$resizeThreshold]: number;
	[$relationTargetEntities]: ReturnType<typeof SparseSet>;
}
