import { $componentCount, $componentMap } from '../component/symbols.js';
import {
	$queryDataMap,
	$queries,
	$dirtyQueries,
	$notQueries,
	$queriesHashMap,
} from '../query/symbols.js';
import { getGlobalSize, removeEntity } from '../entity/Entity.js';
import { World } from './types.js';
import {
	$archetypes,
	$bitflag,
	$localEntities,
	$localEntityLookup,
	$manualEntityRecycling,
	$resizeThreshold,
	$size,
} from './symbols.js';
import { SparseSet } from '../utils/SparseSet.js';
import {
	$entityArray,
	$entityComponents,
	$entityMasks,
	$entitySparseSet,
} from '../entity/symbols.js';
import { resize } from '../storage/Storage.js';
import { queries, registerQuery } from '../query/Query.js';
import { defineHiddenProperties } from '../utils/defineHiddenProperty.js';
import { $relationTargetEntities } from '../relation/symbols.js';

export const worlds: World[] = [];

export const resizeWorlds = (size: number) => {
	worlds.forEach((world) => {
		world[$size] = size;

		for (let i = 0; i < world[$entityMasks].length; i++) {
			const masks = world[$entityMasks][i];
			world[$entityMasks][i] = resize(masks, size);
		}

		world[$resizeThreshold] = world[$size] - world[$size] / 5;
	});
};

export function defineWorld<W extends object = {}>(world: W, size?: number): W & World;
export function defineWorld<W extends World = World>(size?: number): W;
export function defineWorld(...args: any[]) {
	const world = typeof args[0] === 'object' ? args[0] : {};
	const size =
		typeof args[0] === 'number'
			? args[0]
			: typeof args[1] === 'number'
			? args[1]
			: getGlobalSize();

	const entitySparseSet = SparseSet();

	// Define world properties as non-enumerable symbols so they are internal secrets.
	defineHiddenProperties(world, {
		[$size]: size,
		[$entityMasks]: [new Uint32Array(size)],
		[$entityComponents]: new Map(),
		[$archetypes]: [],
		[$entitySparseSet]: entitySparseSet,
		[$entityArray]: entitySparseSet.dense,
		[$bitflag]: 1,
		[$componentMap]: new Map(),
		[$componentCount]: 0,
		[$queryDataMap]: new Map(),
		[$queries]: new Set(),
		[$queriesHashMap]: new Map(),
		[$notQueries]: new Set(),
		[$dirtyQueries]: new Set(),
		[$localEntities]: new Map(),
		[$localEntityLookup]: new Map(),
		[$manualEntityRecycling]: false,
		[$resizeThreshold]: size - size / 5,
		[$relationTargetEntities]: SparseSet(),
	});

	return world;
}

export function registerWorld(world: World) {
	worlds.push(world);

	// Register all queries with the world.
	queries.forEach((query) => registerQuery(world, query));
}

export const enableManualEntityRecycling = (world: World) => {
	world[$manualEntityRecycling] = true;
};

/**
 * Creates a new world.
 *
 * @returns {object}
 */
export function createWorld<W extends object = {}>(world?: W, size?: number): W & World;
export function createWorld<W extends World = World>(size?: number): W;
export function createWorld(...args: any[]) {
	const world = defineWorld(...args);
	registerWorld(world);
	return world;
}

/**
 * Resets a world.
 *
 * @param {World} world
 * @returns {object}
 */
export const resetWorld = (world: World, size = getGlobalSize()) => {
	world[$size] = size;

	if (world[$entityArray]) world[$entityArray].forEach((eid) => removeEntity(world, eid));

	world[$entityMasks] = [new Uint32Array(size)];
	world[$entityComponents] = new Map();
	world[$archetypes] = [];

	world[$entitySparseSet] = SparseSet();
	world[$entityArray] = world[$entitySparseSet].dense;

	world[$bitflag] = 1;

	world[$componentMap] = new Map();
	world[$componentCount] = 0;

	world[$queryDataMap] = new Map();
	world[$queries] = new Set();
	world[$queriesHashMap] = new Map();
	world[$notQueries] = new Set();
	world[$dirtyQueries] = new Set();

	world[$localEntities] = new Map();
	world[$localEntityLookup] = new Map();

	world[$manualEntityRecycling] = false;

	return world;
};

/**
 * Deletes a world.
 *
 * @param {World} world
 */
export const deleteWorld = (world: World) => {
	// Delete all symbol properties
	Object.getOwnPropertySymbols(world).forEach((symbol) => {
		delete world[symbol as keyof World];
	});
	// Delete all string properties too, even though there shouldn't be any
	Object.keys(world).forEach((key) => {
		delete world[key as unknown as keyof World];
	});
	// Remove the world from the worlds array
	worlds.splice(worlds.indexOf(world), 1);
};

/**
 * Returns all components registered to a world
 *
 * @param {World} world
 * @returns Array
 */
export const getWorldComponents = (world: World) => Array.from(world[$componentMap].keys());

/**
 * Returns all existing entities in a world
 *
 * @param {World} world
 * @returns Array
 */
export const getAllEntities = (world: World) => world[$entitySparseSet].dense.slice(0);

export const incrementWorldBitflag = (world: World) => {
	world[$bitflag] *= 2;
	if (world[$bitflag] >= 2 ** 31) {
		world[$bitflag] = 1;
		world[$entityMasks].push(new Uint32Array(world[$size]));
	}
};

export const entityExists = (world: World, eid: number) => {
	return world[$entitySparseSet].has(eid);
};
