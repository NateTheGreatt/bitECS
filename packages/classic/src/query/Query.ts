import { SparseSet } from '../utils/SparseSet.js';
import { registerComponent } from '../component/Component.js';
import { $componentMap } from '../component/symbols.js';
import { $entityMasks, $entityArray, $entitySparseSet } from '../entity/symbols.js';
import { Component } from '../component/types.js';
import { TODO } from '../utils/types.js';
import {
	$dirtyQueries,
	$modifier,
	$notQueries,
	$queries,
	$queriesHashMap,
	$queryComponents,
	$queryDataMap,
	$queueRegisters,
} from './symbols.js';
import { Query, QueryModifier, QueryData, Queue, QueryResult } from './types.js';
import { World } from '../world/types.js';
import { EMPTY } from '../constants/Constants.js';
import { getEntityCursor, worlds } from '../world/World.js';
import { archetypeHash } from './utils.js';

export const queries: Query[] = [];

function modifier(c: Component, mod: string): QueryModifier {
	const inner: TODO = () => [c, mod] as const;
	inner[$modifier] = true;
	return inner;
}

export const Not = (c: Component) => modifier(c, 'not');
export const Or = (c: Component) => modifier(c, 'or');

export function Any(...comps: Component[]) {
	return function QueryAny() {
		return comps;
	};
}
export function All(...comps: Component[]) {
	return function QueryAll() {
		return comps;
	};
}
export function None(...comps: Component[]) {
	return function QueryNone() {
		return comps;
	};
}

export const registerQuery = <W extends World>(world: W, query: Query) => {
	// Early exit if query is already registered.
	if (world[$queryDataMap].has(query)) return;

	const components: TODO = [];
	const notComponents: TODO = [];

	query[$queryComponents].forEach((c: TODO) => {
		if (typeof c === 'function' && c[$modifier]) {
			const [comp, mod] = c();
			if (!world[$componentMap].has(comp)) registerComponent(world, comp);
			if (mod === 'not') {
				notComponents.push(comp);
			}
		} else {
			if (!world[$componentMap].has(c)) registerComponent(world, c);
			components.push(c);
		}
	});

	const mapComponents = (c: Component) => world[$componentMap].get(c)!;
	const allComponents = components.concat(notComponents).map(mapComponents);

	const sparseSet = SparseSet();

	const archetypes: TODO = [];
	const toRemove = SparseSet();

	// A default queue is created and index 0 to be used for enterQuery and exitQuery.
	const enterQueues = [SparseSet()];
	const exitQueues = [SparseSet()];

	const generations = allComponents
		.map((c: TODO) => c.generationId)
		.reduce((a: TODO, v: TODO) => {
			if (a.includes(v)) return a;
			a.push(v);
			return a;
		}, []);

	const reduceBitflags = (a: TODO, c: TODO) => {
		if (!a[c.generationId]) a[c.generationId] = 0;
		a[c.generationId] |= c.bitflag;
		return a;
	};

	const masks = components.map(mapComponents).reduce(reduceBitflags, {});
	const notMasks = notComponents.map(mapComponents).reduce(reduceBitflags, {});
	const hasMasks = allComponents.reduce(reduceBitflags, {});

	const q = Object.assign(sparseSet, {
		archetypes,
		components,
		notComponents,
		allComponents,
		masks,
		notMasks,
		// orMasks,
		hasMasks,
		generations,
		toRemove,
		enterQueues,
		exitQueues,
		query,
	}) as unknown as QueryData;

	world[$queryDataMap].set(query, q);
	world[$queries].add(q);

	const hash = archetypeHash(world, query[$queryComponents]);
	world[$queriesHashMap].set(hash, q);

	allComponents.forEach((c: TODO) => {
		c.queries.add(q);
	});

	if (notComponents.length) world[$notQueries].add(q);

	// Register and create queues.
	query[$queueRegisters].forEach((register) => register(world));

	for (let eid = 0; eid < getEntityCursor(world); eid++) {
		if (!world[$entitySparseSet].has(eid)) continue;
		const match = queryCheckEntity(world, q, eid);
		if (match) queryAddEntity(q, eid);
	}
};

/**
 * Defines a query function which returns a matching set of entities when called on a world.
 *
 * @param {array} components
 * @returns {function} query
 */

export const defineQuery = (components: (Component | QueryModifier)[]): Query => {
	if (components === undefined) {
		const query: Query = function <W extends World>(world: W) {
			return world[$entityArray].slice();
		};

		query[$queryComponents] = components;
		query[$queueRegisters] = [] as Queue[];

		return query;
	}

	const query: Query = function <W extends World>(world: W) {
		const data = world[$queryDataMap].get(query)!;

		commitRemovals(world);

		return data.dense.slice();
	};

	query[$queryComponents] = components;
	query[$queueRegisters] = [] as Queue[];

	// Add to query registry.
	queries.push(query);

	// Register with all worlds.
	worlds.forEach((world) => registerQuery(world, query));

	return query;
};

export function query<W extends World>(
	world: W,
	components: (Component | QueryModifier)[]
): QueryResult;
export function query<W extends World>(world: W, queue: Queue): QueryResult;
export function query<W extends World>(world: W, args: (Component | QueryModifier)[] | Queue) {
	if (Array.isArray(args)) {
		const components = args;
		const hash = archetypeHash(world, components);
		let queryData = world[$queriesHashMap].get(hash);
		if (!queryData) {
			return defineQuery(components)(world);
		} else {
			return queryData.query(world);
		}
	} else {
		const queue = args;
		return queue(world).slice();
	}
}

export const queryCheckEntity = <W extends World>(world: W, q: QueryData, eid: number) => {
	const { masks, notMasks, generations } = q;

	for (let i = 0; i < generations.length; i++) {
		const generationId = generations[i];
		const qMask = masks[generationId];
		const qNotMask = notMasks[generationId];
		const eMask = world[$entityMasks][generationId][eid];

		if (qNotMask && (eMask & qNotMask) !== 0) {
			return false;
		}

		if (qMask && (eMask & qMask) !== qMask) {
			return false;
		}
	}

	return true;
};

export const queryCheckComponent = (q: QueryData, c: TODO) => {
	const { generationId, bitflag } = c;
	const { hasMasks } = q;
	const mask = hasMasks[generationId];
	return (mask & bitflag) === bitflag;
};

export const queryAddEntity = (q: QueryData, eid: number) => {
	q.toRemove.remove(eid);

	// Add to all entered queues.
	for (let i = 0; i < q.enterQueues.length; i++) {
		q.enterQueues[i].add(eid);
	}

	// Remove from all exited queues.
	for (let i = 0; i < q.exitQueues.length; i++) {
		q.exitQueues[i].remove(eid);
	}

	q.add(eid);
};

const queryCommitRemovals = (q: QueryData) => {
	for (let i = q.toRemove.dense.length - 1; i >= 0; i--) {
		const eid = q.toRemove.dense[i];
		q.toRemove.remove(eid);

		q.remove(eid);
	}
};

export const commitRemovals = (world: World) => {
	if (!world[$dirtyQueries].size) return;
	world[$dirtyQueries].forEach(queryCommitRemovals);
	world[$dirtyQueries].clear();
};

export const queryRemoveEntity = <W extends World>(world: W, q: QueryData, eid: number) => {
	const has = q.has(eid); //prettier-ignore
	if (!has || q.toRemove.has(eid)) return;
	q.toRemove.add(eid);
	world[$dirtyQueries].add(q);

	// Add to all exited queues.
	for (let i = 0; i < q.exitQueues.length; i++) {
		q.exitQueues[i].add(eid);
	}

	// Remove from all entered queues.
	for (let i = 0; i < q.enterQueues.length; i++) {
		q.enterQueues[i].remove(eid);
	}
};

/**
 * Removes a query from a world.
 *
 * @param {World} world
 * @param {function} query
 */
export const removeQuery = (world: World, query: Query) => {
	const q = world[$queryDataMap].get(query)!;
	world[$queries].delete(q);
	world[$queryDataMap].delete(query);
	const hash = archetypeHash(world, query[$queryComponents]);
	world[$queriesHashMap].delete(hash);
};

/**
 * Given an existing query, returns a new function which returns entities who have been added to the given query since the last call of the function.
 *
 * @param {function} query
 * @returns {function} enteredQuery
 */
export const enterQuery =
	(query: Query) =>
	(world: World): readonly number[] => {
		if (!world[$queryDataMap].has(query)) registerQuery(world, query);
		const q = world[$queryDataMap].get(query)!;

		if (q.enterQueues[0].dense.length === 0) {
			return EMPTY;
		} else {
			const results = q.enterQueues[0].dense.slice();
			q.enterQueues[0].reset();
			return results;
		}
	};

/**
 * Given an existing query, returns a new function which returns entities who have been removed from the given query since the last call of the function.
 *
 * @param {function} query
 * @returns {function} enteredQuery
 */
export const exitQuery =
	(query: Query) =>
	(world: World): readonly number[] => {
		if (!world[$queryDataMap].has(query)) registerQuery(world, query);
		const q = world[$queryDataMap].get(query)!;

		if (q.exitQueues[0].dense.length === 0) {
			return EMPTY;
		} else {
			const results = q.exitQueues[0].dense.slice();
			q.exitQueues[0].reset();
			return results;
		}
	};
