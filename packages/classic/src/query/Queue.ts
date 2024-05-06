import { Component } from '../component/types';
import { EMPTY } from '../constants/Constants';
import { SparseSet } from '../utils/SparseSet';
import { worlds } from '../world/World';
import { World } from '../world/types';
import { defineQuery } from './Query';
import { $queryDataMap, $queueRegisters } from './symbols';
import { Query, Queue } from './types';

export function defineEnterQueue(query: Query): Queue;
export function defineEnterQueue(components: Component[]): Queue;
export function defineEnterQueue(args: Query | Component[]): Queue {
	const query = typeof args === 'function' ? args : defineQuery(args);
	let index = -1;

	const registerQueue = (world: World) => {
		const data = world[$queryDataMap].get(query);
		if (data) index = data.enterQueues.push(SparseSet()) - 1;
	};

	// Create a queue for each world the query is already registered in.
	for (const world of worlds) {
		registerQueue(world);
	}

	const queue = (world: World, drain = true) => {
		// Get query data.
		const data = world[$queryDataMap].get(query)!;

		if (data.enterQueues[index].dense.length === 0) {
			return EMPTY;
		} else {
			const results = data.enterQueues[index].dense.slice();
			if (drain) data.enterQueues[index].reset();
			return results;
		}
	};

	// Register the queue with the query.
	query[$queueRegisters].push(registerQueue);

	return queue;
}

export function defineExitQueue(query: Query): Queue;
export function defineExitQueue(components: Component[]): Queue;
export function defineExitQueue(args: Query | Component[]): Queue {
	const query = typeof args === 'function' ? args : defineQuery(args);
	let index = -1;

	const registerQueue = (world: World) => {
		const data = world[$queryDataMap].get(query);
		if (data) index = data.exitQueues.push(SparseSet()) - 1;
	};

	// Create a queue for each world the query is already registered in.
	for (const world of worlds) {
		registerQueue(world);
	}

	const queue = (world: World, drain = true) => {
		// Get query data.
		const data = world[$queryDataMap].get(query)!;

		// Lazy create the queue.
		if (index === -1) {
			index = data.exitQueues.push(SparseSet()) - 1;
		}

		if (data.exitQueues[index].dense.length === 0) {
			return EMPTY;
		} else {
			const results = data.exitQueues[index].dense.slice();
			if (drain) data.exitQueues[index].reset();
			return results;
		}
	};

	// Register the queue with the query.
	query[$queueRegisters].push(registerQueue);

	return queue;
}
