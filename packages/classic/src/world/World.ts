import { $componentCount, $componentMap } from '../component/symbols.js';
import {
	$queryDataMap,
	$queries,
	$dirtyQueries,
	$notQueries,
	$queriesHashMap,
} from '../query/symbols.js';
import { removeEntity } from '../entity/Entity.js';
import { World } from './types.js';
import {
	$archetypes,
	$bitflag,
	$bufferQueries,
	$localEntities,
	$localEntityLookup,
} from './symbols.js';
import { SparseSet } from '../utils/SparseSet.js';
import {
	$entityArray,
	$entityComponents,
	$entityMasks,
	$entitySparseSet,
} from '../entity/symbols.js';
import { queries, registerQuery } from '../query/Query.js';
import { defineHiddenProperties } from '../utils/defineHiddenProperty.js';
import { $relationTargetEntities } from '../relation/symbols.js';

export const worlds: World[] = [];

export function defineWorld<W extends object = {}>(world?: W): W & World {
	const entitySparseSet = SparseSet();

	// Define world properties as non-enumerable symbols so they are internal secrets.
	defineHiddenProperties(world, {
		[$entityMasks]: [new Array()],
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
		[$relationTargetEntities]: SparseSet(),
	});

	return world as W & World;
}

export function registerWorld(world: World) {
	worlds.push(world);

	// Register all queries with the world.
	queries.forEach((query) => registerQuery(world, query));
}

/**
 * Creates a new world.
 *
 * @returns {object}
 */
export function createWorld<W extends object = {}>(w?: W): W & World {
	const world = defineWorld(w ?? {});
	registerWorld(world);
	return world as W & World;
}

/**
 * Resets a world.
 *
 * @param {World} world
 * @returns {object}
 */
export const resetWorld = (world: World) => {
	if (world[$entityArray]) world[$entityArray].forEach((eid) => removeEntity(world, eid));

	world[$entityMasks] = [new Array()];
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

	world[$bufferQueries] = false;

	return world;
};

/**
 * Deletes a world.
 *
 * @param {World} world
 */
export const deleteWorld = (world: World) => {
	// Delete all world properties
	const deletedWorld = world as unknown as Record<symbol, any>;
	delete deletedWorld[$entityMasks];
	delete deletedWorld[$entityComponents];
	delete deletedWorld[$archetypes];
	delete deletedWorld[$entitySparseSet];
	delete deletedWorld[$entityArray];
	delete deletedWorld[$bitflag];
	delete deletedWorld[$componentMap];
	delete deletedWorld[$componentCount];
	delete deletedWorld[$queryDataMap];
	delete deletedWorld[$queries];
	delete deletedWorld[$queriesHashMap];
	delete deletedWorld[$notQueries];
	delete deletedWorld[$dirtyQueries];
	delete deletedWorld[$localEntities];
	delete deletedWorld[$localEntityLookup];
	delete deletedWorld[$relationTargetEntities];
	delete deletedWorld[$bufferQueries];

	// Remove the world from the worlds array
	const index = worlds.indexOf(world);
	if (index !== -1) worlds.splice(index, 1);
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
		world[$entityMasks].push(new Array());
	}
};

export const entityExists = (world: World, eid: number) => {
	return world[$entitySparseSet].has(eid);
};

/**
 * Makes queries become array buffers instead of native arrays. Useful for threading.
 *
 * @param world
 * @returns world
 */

export const enableBufferedQueries = <W extends World>(world: W): W & { _bufferQueries: true } => {
	world[$bufferQueries] = true;
	return world as W & { _bufferQueries: true };
};
