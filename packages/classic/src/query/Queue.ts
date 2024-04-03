import { EMPTY } from '../constants/Constants';
import { SparseSet } from '../utils/SparseSet';
import { worlds } from '../world/World';
import { World } from '../world/types';
import { registerQuery } from './Query';
import { $queryDataMap } from './symbols';
import { Query, Queue } from './types';

export function defineEnterQueue(query: Query): Queue {
	let index = -1;

	// Create a queue for each world the query is already registered in.
	for (const world of worlds) {
		const data = world[$queryDataMap].get(query);

		if (data) {
			index = data.enterQueues.push(SparseSet()) - 1;
		}
	}

	return (world: World, drain = true) => {
		// Register the query if it isn't already.
		if (!world[$queryDataMap].has(query)) registerQuery(world, query);

		// Get query data.
		const data = world[$queryDataMap].get(query)!;

		// Lazy create the queue.
		if (index === -1) {
			index = data.enterQueues.push(SparseSet()) - 1;
		}

		if (data.enterQueues[index].dense.length === 0) {
			return EMPTY;
		} else {
			const results = drain 
				? data.enterQueues[index].dense.slice()
				: data.enterQueues[index].dense;
			if (drain) data.enterQueues[index].reset();
			return results;
		}
	};
}

export function defineExitQueue(query: Query): Queue {
	let index = -1;

	// Create a queue for each world the query is already registered in.
	for (const world of worlds) {
		const data = world[$queryDataMap].get(query);

		if (data) {
			index = data.exitQueues.push(SparseSet()) - 1;
		}
	}

	return (world: World, drain = true) => {
		// Register the query if it isn't already.
		if (!world[$queryDataMap].has(query)) registerQuery(world, query);

		// Get query data.
		const data = world[$queryDataMap].get(query)!;

		// Lazy create the queue.
		if (index === -1) {
			index = data.exitQueues.push(SparseSet()) - 1;
		}

		if (data.exitQueues[index].dense.length === 0) {
			return EMPTY;
		} else {
			const results = drain 
				? data.exitQueues[index].dense.slice() 
				: data.exitQueues[index].dense;
			if (drain) data.exitQueues[index].reset();
			return results;
		}
	};
}
