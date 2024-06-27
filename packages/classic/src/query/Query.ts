import { SparseSet } from '../utils/SparseSet.js';
import Uint32SparseSet, { type IUint32SparseSet } from '@bitecs/utils/Uint32SparseSet';
import { hasComponent, registerComponent } from '../component/Component.js';
import { $componentMap } from '../component/symbols.js';
import { $entityMasks, $entityArray, $entitySparseSet } from '../entity/symbols.js';
import { Prefab, getEntityCursor } from '../entity/Entity.js';
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
import { HasBufferQueries, World } from '../world/types.js';
import { createShadow } from '../storage/Storage.js';
import { $storeFlattened, $tagStore } from '../storage/symbols.js';
import { EMPTY } from '../constants/Constants.js';
import { worlds } from '../world/World.js';
import { archetypeHash } from './utils.js';
import { $bufferQueries, $size } from '../world/symbols.js';

export const queries: Query[] = [];

function modifier(c: Component, mod: string): QueryModifier {
	const inner: TODO = () => [c, mod] as const;
	inner[$modifier] = true;
	return inner;
}

export const Not = (c: Component) => modifier(c, 'not');
export const Or = (c: Component) => modifier(c, 'or');
export const Changed = (c: Component) => modifier(c, 'changed');

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
	const changedComponents: TODO = [];

	query[$queryComponents].forEach((c: TODO) => {
		if (typeof c === 'function' && c[$modifier]) {
			const [comp, mod] = c();
			if (!world[$componentMap].has(comp)) registerComponent(world, comp);
			if (mod === 'not') {
				notComponents.push(comp);
			}
			if (mod === 'changed') {
				changedComponents.push(comp);
				components.push(comp);
			}
		} else {
			if (!world[$componentMap].has(c)) registerComponent(world, c);
			components.push(c);
		}
	});

	const mapComponents = (c: Component) => world[$componentMap].get(c)!;
	const allComponents = components.concat(notComponents).map(mapComponents);

	let sparseSet: IUint32SparseSet | ReturnType<typeof SparseSet>;

	if (world[$bufferQueries]) {
		// `world[$size] * 2` is the maximum size our buffer can grow with recycling.
		const size = world[$size] === -1 ? 100_000 : world[$size] * 2;
		sparseSet = Uint32SparseSet.create(1024, size > 1024 ? size : 1024);
	} else {
		sparseSet = SparseSet();
	}

	const archetypes: TODO = [];
	const changed: TODO = [];
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

	const flatProps = components
		.filter((c: TODO) => !c[$tagStore])
		.map((c: TODO) =>
			Object.getOwnPropertySymbols(c).includes($storeFlattened) ? c[$storeFlattened] : [c]
		)
		.reduce((a: TODO, v: TODO) => a.concat(v), []);

	const shadows: TODO = [];

	const q = Object.assign(sparseSet, {
		archetypes,
		changed,
		components,
		notComponents,
		changedComponents,
		allComponents,
		masks,
		notMasks,
		// orMasks,
		hasMasks,
		generations,
		flatProps,
		toRemove,
		enterQueues,
		exitQueues,
		shadows,
		query,
	}) as unknown as QueryData<HasBufferQueries<W>>;

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

	for (let eid = 0; eid < getEntityCursor(); eid++) {
		if (!world[$entitySparseSet].has(eid)) continue;
		if (hasComponent(world, Prefab, eid)) continue;
		const match = queryCheckEntity(world, q, eid);
		if (match) queryAddEntity(q, eid);
	}
};

const generateShadow = (q: TODO, pid: number) => {
	const $ = Symbol();
	const prop = q.flatProps[pid];
	createShadow(prop, $);
	q.shadows[pid] = prop[$];
	return prop[$];
};

const diff = (q: QueryData, clearDiff: boolean) => {
	if (clearDiff) q.changed = [];
	const { flatProps, shadows } = q;
	for (let i = 0; i < q.dense.length; i++) {
		const eid = q.dense[i];
		let dirty = false;
		for (let pid = 0; pid < flatProps.length; pid++) {
			const prop = flatProps[pid];
			const shadow = shadows[pid] || generateShadow(q, pid);
			if (ArrayBuffer.isView(prop[eid])) {
				// @ts-expect-error
				for (let i = 0; i < prop[eid].length; i++) {
					// @ts-expect-error
					if (prop[eid][i] !== shadow[eid][i]) {
						dirty = true;
						break;
					}
				}
				shadow[eid].set(prop[eid]);
			} else {
				if (prop[eid] !== shadow[eid]) {
					dirty = true;
					shadow[eid] = prop[eid];
				}
			}
		}
		if (dirty) q.changed.push(eid);
	}
	return q.changed;
};

// const queryEntityChanged = (q, eid) => {
//   if (q.changed.has(eid)) return
//   q.changed.add(eid)
// }

// export const entityChanged = (world, component, eid) => {
//   const { changedQueries } = world[$componentMap].get(component)
//   changedQueries.forEach(q => {
//     const match = queryCheckEntity(world, q, eid)
//     if (match) queryEntityChanged(q, eid)
//   })
// }

const flatten = (a: Array<number>, v: Array<number>) => a.concat(v);

const aggregateComponentsFor = (mod: TODO) => (x: TODO) =>
	x.filter((f: TODO) => f.name === mod().constructor.name).reduce(flatten);

const getAnyComponents = aggregateComponentsFor(Any);
const getAllComponents = aggregateComponentsFor(All);
const getNoneComponents = aggregateComponentsFor(None);

/**
 * Defines a query function which returns a matching set of entities when called on a world.
 *
 * @param {array} components
 * @returns {function} query
 */

export const defineQuery = (components: Component[]): Query => {
	if (components === undefined) {
		const query: Query = function <W extends World>(world: W) {
			return (
				world[$bufferQueries]
					? new Uint32Array(world[$entityArray])
					: Array.from(world[$entityArray])
			) as QueryResult<W>;
		};

		query[$queryComponents] = components;
		query[$queueRegisters] = [] as Queue[];

		return query;
	}

	const query: Query = function (world, clearDiff = true) {
		const data = world[$queryDataMap].get(query)!;

		commitRemovals(world);

		if (data.changedComponents.length) return diff(data, clearDiff);
		if (data.changedComponents.length) return data.changed.dense;

		return world[$bufferQueries] ? data.dense : Array.from(data.dense);
	};

	query[$queryComponents] = components;
	query[$queueRegisters] = [] as Queue[];

	// Add to query registry.
	queries.push(query);

	// Register with all worlds.
	worlds.forEach((world) => registerQuery(world, query));

	return query;
};

export function query<W extends World>(world: W, components: Component[]): QueryResult<W>;
export function query<W extends World>(world: W, queue: Queue): QueryResult<W>;
export function query<W extends World>(world: W, args: Component[] | Queue) {
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
		return world[$bufferQueries] ? new Uint32Array(queue(world)) : Array.from(queue(world));
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

	if (q.dense instanceof Uint32Array) Uint32SparseSet.add(q as QueryData<true>, eid);
	else (q as QueryData<false>).add(eid);
};

const queryCommitRemovals = (q: QueryData) => {
	for (let i = q.toRemove.dense.length - 1; i >= 0; i--) {
		const eid = q.toRemove.dense[i];
		q.toRemove.remove(eid);

		if (q.dense instanceof Uint32Array) Uint32SparseSet.remove(q as QueryData<true>, eid);
		else (q as QueryData<false>).remove(eid);
	}
};

export const commitRemovals = (world: World) => {
	if (!world[$dirtyQueries].size) return;
	world[$dirtyQueries].forEach(queryCommitRemovals);
	world[$dirtyQueries].clear();
};

export const queryRemoveEntity = <W extends World>(world: W, q: QueryData, eid: number) => {
	const has = world[$bufferQueries] ? Uint32SparseSet.has(q as QueryData<true>, eid) : (q as QueryData<false>).has(eid); //prettier-ignore
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
 * Resets a Changed-based query, clearing the underlying list of changed entities.
 *
 * @param {World} world
 * @param {function} query
 */
export const resetChangedQuery = (world: World, query: TODO) => {
	const q = world[$queryDataMap].get(query)!;
	q.changed = [];
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
