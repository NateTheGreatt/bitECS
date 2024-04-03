import { Component } from '../component/types';
import { SparseSet } from '../utils/SparseSet';
import { World } from '../world/types';
import { type IUint32SparseSet } from '@bitecs/utils/Uint32SparseSet';

export type QueryModifier<W extends World = World> = (
	c: Component[]
) => (world: W) => Component | QueryModifier<W>;

export type Query<W extends World = World> = (world: W, clearDiff?: boolean) => Uint32Array;

export type QueryData = IUint32SparseSet & {
	archetypes: any;
	changed: any;
	notComponents: any;
	changedComponents: any;
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

export type Queue<W extends World = World> = (world: W) => readonly number[];
