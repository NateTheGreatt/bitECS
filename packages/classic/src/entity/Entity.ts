import { addComponentInternal, removeComponent } from '../component/Component.js';
import { Component } from '../component/types.js';
import { query, queryAddEntity, queryCheckEntity, queryRemoveEntity } from '../query/Query.js';
import { $notQueries, $queries } from '../query/symbols.js';
import { Pair, Wildcard } from '../relation/Relation.js';
import {
	$autoRemoveSubject,
	$isPairComponent,
	$onTargetRemoved,
	$pairTarget,
	$relation,
	$relationTargetEntities,
} from '../relation/symbols.js';
import { TODO } from '../utils/types.js';
import { $entityCursor, $localEntities, $localEntityLookup, $recycled } from '../world/symbols.js';
import { World } from '../world/types.js';
import { getRemovedLength, dequeueFromRemoved } from '../world/World.js';
import { $entityComponents, $entityMasks, $entitySparseSet } from './symbols.js';

export const Prefab = {};

/**
 * Adds a new entity to the specified world, adding any provided component to the entity.
 *
 * @param {World} world
 * @param {...Component} components
 * @returns {number} eid
 */
export const addEntity = (world: World, ...components: Component[]): number => {
	let eid: number;

	if (getRemovedLength(world) > 0) {
		eid = dequeueFromRemoved(world);
	} else {
		eid = world[$entityCursor]++;
	}

	world[$entitySparseSet].add(eid);

	world[$notQueries].forEach((q) => {
		const match = queryCheckEntity(world, q, eid);
		if (match) queryAddEntity(q, eid);
	});

	world[$entityComponents].set(eid, new Set());

	for (const component of components) {
		addComponentInternal(world, eid, component);
	}

	return eid;
};

/**
 * Removes an existing entity from the specified world.
 *
 * @param {World} world
 * @param {number} eid
 */
export const removeEntity = (world: World, eid: number) => {
	// Check if entity is already removed
	if (!world[$entitySparseSet].has(eid)) return;

	// Remove relation components from entities that have a relation to this one
	// e.g. addComponent(world, Pair(ChildOf, parent), child)
	// when parent is removed, we need to remove the child

	// check to see if this entity is a relation target at all
	if (world[$relationTargetEntities].has(eid)) {
		// if it is, iterate over all subjects with any relation to this eid
		for (const subject of query(world, [Pair(Wildcard, eid)])) {
			// TODO: can we avoid this check? (subject may have been removed already)
			if (!entityExists(world, subject)) {
				continue;
			}
			// remove the wildcard association with the subject for this entity
			removeComponent(world, subject, Pair(Wildcard, eid));

			// iterate all relations that the subject has to this entity
			for (const component of world[$entityComponents].get(subject)!) {
				// TODO: can we avoid this check? (subject may have been removed by this loop already)
				if (!component[$isPairComponent] || !entityExists(world, subject)) {
					continue;
				}
				const relation = component[$relation]!;

				if (component[$pairTarget] === eid) {
					removeComponent(world, subject, component);
					if (relation[$autoRemoveSubject]) {
						removeEntity(world, subject);
					}
					if (relation[$onTargetRemoved]) {
						relation[$onTargetRemoved](world, subject, eid);
					}
				}
			}
		}
	}

	// Remove entity from all queries
	// TODO: archetype graph
	for (const query of world[$queries]) {
		queryRemoveEntity(world, query, eid);
	}

	// Free the entity
	world[$recycled].push(eid);

	// remove all eid state from world
	world[$entitySparseSet].remove(eid);
	world[$entityComponents].delete(eid);

	// remove from deserializer mapping
	world[$localEntities].delete(world[$localEntityLookup].get(eid));
	world[$localEntityLookup].delete(eid);

	// Clear entity bitmasks
	for (let i = 0; i < world[$entityMasks].length; i++) world[$entityMasks][i][eid] = 0;
};

/**
 *  Returns an array of components that an entity possesses.
 *
 * @param {*} world
 * @param {*} eid
 */
export const getEntityComponents = (world: World, eid: number): TODO[] => {
	if (!world[$entitySparseSet].has(eid))
		throw new Error('bitECS - entity does not exist in the world.');
	return Array.from(world[$entityComponents].get(eid)!);
};

/**
 * Checks the existence of an entity in a world
 *
 * @param {World} world
 * @param {number} eid
 */
export const entityExists = (world: World, eid: number) => world[$entitySparseSet].has(eid);
