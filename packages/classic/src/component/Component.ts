import { Prefab, getEntityComponents, getGlobalSize } from '../entity/Entity.js';
import { $entityComponents, $entityMasks } from '../entity/symbols.js';
import { $worldToPrefab } from '../prefab/symbols.js';
import { PrefabToken } from '../prefab/types.js';
import { query, queryAddEntity, queryCheckEntity, queryRemoveEntity } from '../query/Query.js';
import { $queries } from '../query/symbols.js';
import { QueryData } from '../query/types.js';
import { IsA, Pair, Wildcard, getRelationTargets } from '../relation/Relation.js';
import {
	$exclusiveRelation,
	$isPairComponent,
	$pairTarget,
	$relation,
	$relationTargetEntities,
} from '../relation/symbols.js';
import { createStore, resetStoreFor } from '../storage/Storage.js';
import { Schema } from '../storage/types.js';
import { entityExists, incrementWorldBitflag } from '../world/World.js';
import { $bitflag } from '../world/symbols.js';
import { World } from '../world/types.js';
import { $componentCount, $componentMap, $schema } from './symbols.js';
import { Component, ComponentNode, ComponentType } from './types.js';

/**
 * Defines a new component store.
 *
 * @param {object} schema
 * @returns {object}
 */
export const defineComponent = <T extends Schema>(
	schema: T = {} as T,
	size?: number
): ComponentType<T> => {
	const component = createStore(schema, size || getGlobalSize());
	if (schema && Object.keys(schema).length) component[$schema] = schema;
	return component;
};

/**
 * Registers a component with a world.
 *
 * @param {World} world
 * @param {Component} component
 */
export const registerComponent = (world: World, component: Component) => {
	if (!component) {
		throw new Error(`bitECS - Cannot register null or undefined component`);
	}

	const queries = new Set<QueryData>();
	const notQueries = new Set<QueryData>();
	const changedQueries = new Set<QueryData>();

	// Collect all queries that match this component.
	world[$queries].forEach((queryNode) => {
		if (queryNode.allComponents.includes(component)) {
			queries.add(queryNode);
		}
	});

	// Register internal component node with world.
	const componentNode: ComponentNode = {
		id: world[$componentCount]++,
		generationId: world[$entityMasks].length - 1,
		bitflag: world[$bitflag],
		ref: component,
		queries,
		notQueries,
		changedQueries,
	};

	world[$componentMap].set(component, componentNode);

	incrementWorldBitflag(world);
};

/**
 * Registers multiple components with a world.
 *
 * @param {World} world
 * @param {Component[]} components
 */
export const registerComponents = (world: World, components: Component[]) => {
	components.forEach((component) => registerComponent(world, component));
};

/**
 * Checks if an entity has a component.
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 * @returns {boolean}
 */
export const hasComponent = (world: World, component: Component, eid: number): boolean => {
	const registeredComponent = world[$componentMap].get(component);
	if (!registeredComponent) return false;

	const { generationId, bitflag } = registeredComponent;
	const mask = world[$entityMasks][generationId][eid];

	return (mask & bitflag) === bitflag;
};

const recursivelyInherit = (world: World, baseEid: number, inheritedEid: number | PrefabToken) => {
	if (inheritedEid instanceof Object) {
		inheritedEid = inheritedEid[$worldToPrefab].get(world)!;
	}

	// inherit type
	addComponent(world, IsA(inheritedEid), baseEid);
	// inherit components
	const components = getEntityComponents(world, inheritedEid);
	for (const component of components) {
		if (component === Prefab) {
			continue;
		}
		addComponent(world, component, baseEid);
		// TODO: inherit values for structs other than SoA
		const keys = Object.keys(component);
		for (const key of keys) {
			component[key][baseEid] = component[key][inheritedEid];
		}
	}

	const inheritedTargets = getRelationTargets(world, IsA, inheritedEid);
	for (const inheritedEid2 of inheritedTargets) {
		recursivelyInherit(world, baseEid, inheritedEid2);
	}
};

/**
 * Adds a component to an entity
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 * @param {boolean} [reset=false]
 */
export const addComponent = (world: World, component: Component, eid: number, reset = false) => {
	if (!entityExists(world, eid)) {
		throw new Error('bitECS - entity does not exist in the world.');
	}

	// Register the component with the world if it isn't already.
	if (!world[$componentMap].has(component)) registerComponent(world, component);

	// Exit early if the entity already has the component.
	if (hasComponent(world, component, eid)) return;

	const componentNode = world[$componentMap].get(component)!;
	const { generationId, bitflag, queries } = componentNode;

	// Add bitflag to entity bitmask.
	world[$entityMasks][generationId][eid] |= bitflag;

	// Add entity to matching queries, except for prefabs
	if (!hasComponent(world, Prefab, eid)) {
		queries.forEach((queryNode: QueryData) => {
			// Remove this entity from toRemove if it exists in this query.
			queryNode.toRemove.remove(eid);
			const match = queryCheckEntity(world, queryNode, eid);

			if (match) queryAddEntity(queryNode, eid);
			else queryRemoveEntity(world, queryNode, eid);
		});
	}

	// Add component to entity internally.
	world[$entityComponents].get(eid)!.add(component);

	// Zero out each property value.
	if (reset) resetStoreFor(component, eid);

	// Add wildcard relation if its a Pair component
	if (component[$isPairComponent]) {
		// add wildcard relation components
		const relation = component[$relation];
		addComponent(world, Pair(relation, Wildcard), eid);
		const target = component[$pairTarget];
		addComponent(world, Pair(Wildcard, target), eid);

		// if it's an exclusive relation, remove the old target
		if (relation[$exclusiveRelation] === true && target !== Wildcard) {
			const oldTarget = getRelationTargets(world, relation, eid)[0];
			if (oldTarget >= 0 && oldTarget !== target) {
				removeComponent(world, relation(oldTarget), eid);
			}
		}

		// mark entity as a relation target
		world[$relationTargetEntities].add(target);

		// if it's the IsA relation, add the inheritance chain of relations
		if (relation === IsA) {
			// recursively travel up the chain of relations
			const inheritedTargets = getRelationTargets(world, IsA, eid);
			for (const inherited of inheritedTargets) {
				recursivelyInherit(world, eid, inherited);
			}
		}
	}
};

/**
 * Adds multiple components to an entity.
 *
 * @param {World} world
 * @param {Component[]} components
 * @param {number} eid
 * @param {boolean} [reset=false]
 */
export const addComponents = (world: World, components: Component[], eid: number, reset = false) => {
	components.forEach((component) => addComponent(world, component, eid, reset));
};

/**
 * Removes a component from an entity.
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 * @param {boolean} [reset=true]
 */
export const removeComponent = (world: World, component: Component, eid: number, reset = true) => {
	if (!entityExists(world, eid)) {
		throw new Error('bitECS - entity does not exist in the world.');
	}

	// Exit early if the entity does not have the component.
	if (!hasComponent(world, component, eid)) return;

	const componentNode = world[$componentMap].get(component)!;
	const { generationId, bitflag, queries } = componentNode;

	// Remove flag from entity bitmask.
	world[$entityMasks][generationId][eid] &= ~bitflag;

	// Remove entity from matching queries.
	queries.forEach((queryNode: QueryData) => {
		// Remove this entity from toRemove if it exists in this query.
		queryNode.toRemove.remove(eid);

		const match = queryCheckEntity(world, queryNode, eid);

		if (match) queryAddEntity(queryNode, eid);
		else queryRemoveEntity(world, queryNode, eid);
	});

	// Remove component from entity internally.
	world[$entityComponents].get(eid)!.delete(component);

	// Zero out each property value.
	if (reset) resetStoreFor(component, eid);

	// Remove wildcard relations if its a Pair component
	if (component[$isPairComponent]) {
		// check if eid is still a subject of any relation or not
		if (query(world, [Wildcard(eid)]).length === 0) {
			world[$relationTargetEntities].remove(eid);
			// TODO: cleanup query by hash
			// removeQueryByHash(world, [Wildcard(eid)])
		}

		// remove wildcard to this target for this eid
		const target = component[$pairTarget];
		removeComponent(world, Pair(Wildcard, target), eid);

		// remove wildcard relation if eid has no other relations
		const relation = component[$relation];
		const otherTargets = getRelationTargets(world, relation, eid);
		if (otherTargets.length === 0) {
			removeComponent(world, Pair(relation, Wildcard), eid);
		}

		// TODO: recursively disinherit
	}
};

/**
 * Removes multiple components from an entity.
 *
 * @param {World} world
 * @param {Component[]} components
 * @param {number} eid
 * @param {boolean} [reset=true]
 */
export const removeComponents = (
	world: World,
	components: Component[],
	eid: number,
	reset = true
) => {
	components.forEach((component) => removeComponent(world, component, eid, reset));
};
