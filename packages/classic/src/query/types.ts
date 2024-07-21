import { ComponentDefinition } from '../component/types';
import { SparseSet } from '../utils/SparseSet';
import { World } from '../world/types';
import { $queryComponents, $queueRegisters } from './symbols';

export type QueryModifier<W extends World = World> = (
	c: ComponentDefinition[]
) => (world: W) => ComponentDefinition | QueryModifier<W>;

export type QueryResult = readonly number[];

export type Query = (<W extends World = World>(world: W) => QueryResult) & {
	[$queryComponents]: (ComponentDefinition | QueryModifier)[];
	[$queueRegisters]: ((world: World) => void)[];
};

export type QueryData = ReturnType<typeof SparseSet> & {
	archetypes: any;
	notComponents: any;
	allComponents: ComponentDefinition[];
	masks: any;
	notMasks: any;
	hasMasks: any;
	generations: any;
	toRemove: ReturnType<typeof SparseSet>;
	enterQueues: ReturnType<typeof SparseSet>[];
	exitQueues: ReturnType<typeof SparseSet>[];
	shadows: any;
	query: Query;
};

export type Queue<W extends World = World> = (world: W, drain?: boolean) => readonly number[];
