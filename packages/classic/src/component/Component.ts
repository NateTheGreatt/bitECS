import { queryAddEntity, queryRemoveEntity, queryCheckEntity } from '../query/Query.js';
import { $bitflag, $size } from '../world/symbols.js';
import { $entityMasks, $entityComponents } from '../entity/symbols.js';
import { Component, ComponentNode, ComponentType } from './types.js';
import { World } from '../world/types.js';
import { $componentCount, $componentMap } from './symbols.js';
import { $queries } from '../query/symbols.js';
import { entityExists, incrementWorldBitflag } from '../world/World.js';
import { QueryData } from '../query/types.js';
import { Schema } from '../storage/types.js';
import { createStore, resetStoreFor } from '../storage/Storage.js';
import { getGlobalSize } from '../entity/Entity.js';
import { $isPairComponent, $relation, Pair, Wildcard } from '../relation/Relation.js';

export const components: Component[] = [];

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
	if (schema && Object.keys(schema).length) components.push(component);
	return component;
};

export const incrementBitflag = (world: World) => {
	world[$bitflag] *= 2;
	if (world[$bitflag] >= 2 ** 31) {
		world[$bitflag] = 1;
		world[$entityMasks].push(new Uint32Array(world[$size]));
	}
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

	// Add entity to matching queries.
	queries.forEach((queryNode: QueryData) => {
		// Remove this entity from toRemove if it exists in this query.
		queryNode.toRemove.remove(eid);
		const match = queryCheckEntity(world, queryNode, eid);

		if (match) queryAddEntity(queryNode, eid);
		else queryRemoveEntity(world, queryNode, eid);
	});

	// Add component to entity internally.
	world[$entityComponents].get(eid)!.add(component);

	// Zero out each property value.
	if (reset) resetStoreFor(component, eid);

	// Add wildcard relation if its a Pair component
	if (component[$isPairComponent]) {
		addComponent(world, Pair(component[$relation], Wildcard), eid)
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

	// Add wildcard relation if its a Pair component
	if (component[$isPairComponent]) {
		removeComponent(world, Pair(component[$relation], Wildcard), eid)
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
