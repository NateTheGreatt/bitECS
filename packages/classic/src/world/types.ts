import { $componentCount, $componentMap } from '../component/symbols';
import { Component, ComponentNode } from '../component/types';
import { $entityArray, $entityComponents, $entityMasks, $entitySparseSet } from '../entity/symbols';
import { PrefabNode } from '../prefab/types';
import {
	$dirtyQueries,
	$notQueries,
	$queries,
	$queriesHashMap,
	$queryDataMap,
} from '../query/symbols';
import { Query, QueryData } from '../query/types';
import { $relationTargetEntities } from '../relation/symbols';
import { RelationTarget } from '../relation/types';
import { SparseSet } from '../utils/SparseSet';
import {
	$archetypes,
	$bitflag,
	$eidToPrefab,
	$entityCursor,
	$localEntities,
	$localEntityLookup,
	$recycled,
	$removed,
	$removedOut,
} from './symbols';

export interface World {
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
	[$relationTargetEntities]: Set<RelationTarget>;
	[$recycled]: number[];
	[$removed]: number[];
	[$removedOut]: number[];
	[$entityCursor]: number;
	[$eidToPrefab]: Map<number, PrefabNode>;
}

export type IWorld = World;
