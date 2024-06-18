import { $componentCount, $componentMap } from '../component/symbols';
import { Component, ComponentNode } from '../component/types';
import { $entityArray, $entityComponents, $entityMasks, $entitySparseSet } from '../entity/symbols';
import {
	$dirtyQueries,
	$notQueries,
	$queries,
	$queriesHashMap,
	$queryDataMap,
} from '../query/symbols';
import { Query, QueryData } from '../query/types';
import { $relationTargetEntities } from '../relation/symbols';
import { SparseSet } from '../utils/SparseSet';
import {
	$archetypes,
	$bitflag,
	$bufferQueries,
	$localEntities,
	$localEntityLookup,
	$manualEntityRecycling,
	$size,
} from './symbols';

export interface World<TBufferQueries extends boolean = false | true> {
	[$size]: number;
	[$entityArray]: number[];
	[$entityMasks]: Array<number>[];
	[$entityComponents]: Map<number, Set<Component>>;
	[$archetypes]: any[];
	[$entitySparseSet]: ReturnType<typeof SparseSet>;
	[$bitflag]: number;
	[$componentMap]: Map<Component, ComponentNode>;
	[$componentCount]: number;
	[$queryDataMap]: Map<Query, QueryData<TBufferQueries>>;
	[$queries]: Set<QueryData<TBufferQueries>>;
	[$queriesHashMap]: Map<string, QueryData<TBufferQueries>>;
	[$notQueries]: Set<any>;
	[$dirtyQueries]: Set<any>;
	[$localEntities]: Map<any, any>;
	[$localEntityLookup]: Map<any, any>;
	[$relationTargetEntities]: ReturnType<typeof SparseSet>;
	[$manualEntityRecycling]: boolean;
	[$bufferQueries]: boolean;

	// Internal flag
	_bufferQueries: TBufferQueries;
}

export type HasBufferQueries<W extends World> = W extends { _bufferQueries: true } ? true : false;
