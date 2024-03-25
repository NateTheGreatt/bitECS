import { $dirtyQueries, $notQueries, $queries, $queryMap } from '../query/symbols';
import { $entityArray, $entityComponents, $entityMasks, $entitySparseSet } from '../entity/symbols';
import { SparseSet, Uint32SparseSet } from '../utils/SparseSet';
import {
	$archetypes,
	$bitflag,
	$localEntities,
	$localEntityLookup,
	$manualEntityRecycling,
	$resizeThreshold,
	$size,
} from './symbols';
import { $componentMap } from '../component/symbols';
import { Query, QueryNode } from '../query/types';
import { Component, ComponentNode } from '../component/types';

export interface World {
	[key: string]: any;
	[$size]: number;
	[$entityArray]: number[];
	[$entityMasks]: Uint32Array[];
	[$entityComponents]: Map<number, Set<Component>>;
	[$archetypes]: any[];
	[$entitySparseSet]: ReturnType<typeof Uint32SparseSet>;
	[$bitflag]: number;
	[$componentMap]: Map<Component, ComponentNode>;
	[$queryMap]: Map<Query, QueryNode>;
	[$queries]: Set<QueryNode>;
	[$notQueries]: Set<any>;
	[$dirtyQueries]: Set<any>;
	[$localEntities]: Map<any, any>;
	[$localEntityLookup]: Map<any, any>;
	[$manualEntityRecycling]: boolean;
	[$resizeThreshold]: number;
}
