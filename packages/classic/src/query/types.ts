import { Component } from '../component/types';
import { SparseSet } from '../utils/SparseSet';
import { HasBufferQueries, World } from '../world/types';
import { type IUint32SparseSet } from '@bitecs/utils/Uint32SparseSet';
import { $queryComponents, $queueRegisters } from './symbols';

export type QueryModifier<W extends World = World> = (
	c: Component[]
) => (world: W) => Component | QueryModifier<W>;

export type QueryResult<W extends World = World, TTest = HasBufferQueries<W>> = TTest extends true
	? Uint32Array
	: readonly number[];

export type Query = (<W extends World = World>(world: W) => QueryResult<W>) & {
	[$queryComponents]: Component[];
	[$queueRegisters]: ((world: World) => void)[];
};

export type QueryData<TBufferQueries extends boolean = false | true> = (TBufferQueries extends true
	? IUint32SparseSet
	: ReturnType<typeof SparseSet>) & {
	archetypes: any;
	notComponents: any;
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

export type Queue<W extends World = World> = (world: W, drain?: boolean) => readonly number[];
