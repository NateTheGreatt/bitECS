import { $entityComponents, $entityMasks } from '../entity/symbols.js';
import { $onAdd, $onRemove } from '../hooks/symbols.js';
import { ComponentOrWithParams } from '../hooks/types.js';
import { $children, $hierarchy, $prefabComponents, $worldToPrefab } from '../prefab/symbols.js';
import { Prefab } from '../prefab/types.js';
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
import { defineHiddenProperties } from '../utils/defineHiddenProperty.js';
import { entityExists, incrementWorldBitflag } from '../world/World.js';
import { $bitflag } from '../world/symbols.js';
import { World } from '../world/types.js';
import { $componentCount, $componentMap, $store } from './symbols.js';
import { Component, ComponentNode } from './types.js';

export const getStore = <Store>(world: World, component: Component<Store>) => {
	if (!world[$componentMap].has(component)) registerComponent(world, component);

	return world[$componentMap].get(component as any)?.store as Store;
};

/**
 * Defines a new component store.
 *
 * @param {object} schema
 *
 * @returns {object}
 */
export function defineComponent<Store, Params = void>(store: () => Store): Component<Store, Params> {
	const component = {} as Component<Store, Params>;

	defineHiddenProperties(component, {
		[$store]: store ?? (() => ({})),
	});

	return component;
}

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
		store: component[$store]?.() ?? {},
		queries,
		notQueries,
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
 * @param {number} eid
 * @param {Component} component
 * @returns {boolean}
 */
export const hasComponent = (world: World, eid: number, component: Component): boolean => {
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
export const addComponent = (world: World, eid: number, arg: ComponentOrWithParams) => {
	if (!entityExists(world, eid)) {
		throw new Error('bitECS - entity does not exist in the world.');
	}

	addComponentsInternal(world, eid, [arg]);
};

/**
 * Adds multiple components to an entity.
 *
 * @param {World} world
 * @param {number} eid
 * @param {...ComponentOrWithParams} components
 */
export function addComponents(world: World, eid: number, ...args: ComponentOrWithParams[]) {
	if (!entityExists(world, eid)) {
		throw new Error('bitECS - entity does not exist in the world.');
	}

	addComponentsInternal(world, eid, args);
}

export const addComponentsInternal = (world: World, eid: number, args: ComponentOrWithParams[]) => {
	const components = new Map<Component | Prefab, any>();
	const children: Prefab[] = [];

	/*
	 * Build a component/params map to avoid adding components
	 * repeatedly and to allow params overriding
	 */
	for (const arg of args) {
		let component: Component;
		let params: any;
		// Check if it's a component/params tuple or not
		if (Array.isArray(arg)) {
			component = arg[0];
			params = arg[1];
		} else {
			component = arg;
		}

		if (!component[$isPairComponent]) {
			components.set(component, params);
			continue;
		}

		const relation = component[$relation]!;
		components.set(Pair(relation, Wildcard), null);
		const target = component[$pairTarget]!;
		components.set(Pair(Wildcard, target), null);

		// If inheriting a prefab, go through its hierarchy to resolve
		// component params and children to be added
		if (component[$relation] === IsA) {
			let prefab = component[$pairTarget] as Prefab;

			// Set the prefab instead of the relation so that we can call its onAdd hook
			components.set(prefab, params);

			if (prefab[$children]) {
				children.push(...prefab[$children]);
			}
			const hierarchy = prefab[$hierarchy];

			// Go trough each component higher in the hierarchy
			// Add its components and params
			for (const hierarchyPrefab of hierarchy) {
				components.set(hierarchyPrefab, null);
				const prefabComponents = hierarchyPrefab[
					$prefabComponents
				] as ComponentOrWithParams[];

				for (const prefabComponent of prefabComponents) {
					if (Array.isArray(prefabComponent)) {
						const component = prefabComponent[0];
						const params = prefabComponent[1];

						components.set(component, params);
					} else {
						// check because only non-null parameters should override
						if (!components.has(prefabComponent)) {
							components.set(prefabComponent, null);
						}
					}
				}
			}
		} else {
			components.set(component, null);
		}
	}

	for (const tuple of components.entries()) {
		if ($worldToPrefab in tuple[0]) {
			// prefab
			addComponentInternal(world, eid, IsA(tuple[0]));
			tuple[0][$onAdd]?.(world, eid, tuple[1]);
		} else {
			addComponentInternal(world, eid, tuple[0]);
			if (tuple[0][$relation] && tuple[0][$pairTarget] !== Wildcard) {
				tuple[0][$relation][$onAdd]?.(world, getStore(world, tuple[0]), eid, tuple[1]);
			} else {
				tuple[0][$onAdd]?.(world, getStore(world, tuple[0]), eid, tuple[1]);
			}
		}
	}
};

export const addComponentInternal = (world: World, eid: number, component: Component) => {
	// Exit early if the entity already has the component.
	if (hasComponent(world, eid, component)) return;

	// Register the component with the world if it isn't already.
	if (!world[$componentMap].has(component)) registerComponent(world, component);

	const componentNode = world[$componentMap].get(component)!;
	const { generationId, bitflag, queries } = componentNode;

	// Add bitflag to entity bitmask.
	world[$entityMasks][generationId][eid] |= bitflag;

	queries.forEach((queryNode: QueryData) => {
		// Remove this entity from toRemove if it exists in this query.
		queryNode.toRemove.remove(eid);
		const match = queryCheckEntity(world, queryNode, eid);

		if (match) queryAddEntity(queryNode, eid);
		else queryRemoveEntity(world, queryNode, eid);
	});

	// Add component to entity internally.
	world[$entityComponents].get(eid)!.add(component);

	if (component[$isPairComponent]) {
		const relation = component[$relation]!;
		const target = component[$pairTarget]!;
		world[$relationTargetEntities].add(target);
		if (relation[$exclusiveRelation] === true && target !== Wildcard) {
			const oldTarget = getRelationTargets(world, relation, eid)[0];
			if (oldTarget !== null && oldTarget !== undefined && oldTarget !== target) {
				removeComponent(world, eid, relation(oldTarget));
			}
		}
	}
};

/**
 * Removes a component from an entity.
 *
 * @param {World} world
 * @param {number} eid
 * @param {Component} component
 * @param {boolean} [reset=true]
 */
export const removeComponent = (world: World, eid: number, component: Component, reset = true) => {
	if (!entityExists(world, eid)) {
		throw new Error('bitECS - entity does not exist in the world.');
	}

	// Exit early if the entity does not have the component.
	if (!hasComponent(world, eid, component)) return;

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

	// Remove wildcard relations if its a Pair component
	if (component[$isPairComponent]) {
		// check if eid is still a subject of any relation or not
		if (query(world, [Wildcard(eid)]).length === 0) {
			world[$relationTargetEntities].delete(eid);
			// TODO: cleanup query by hash
			// removeQueryByHash(world, [Wildcard(eid)])
		}

		// remove wildcard to this target for this eid
		const target = component[$pairTarget]!;
		removeComponent(world, eid, Pair(Wildcard, target));

		// remove wildcard relation if eid has no other relations
		const relation = component[$relation]!;
		const otherTargets = getRelationTargets(world, relation, eid);
		if (otherTargets.length === 0) {
			removeComponent(world, eid, Pair(relation, Wildcard));
		}

		if (component[$relation] === IsA) {
			(component[$pairTarget] as Prefab)[$onRemove]?.(world, eid, reset);
		} else if (component[$pairTarget] !== Wildcard) {
			component[$relation]![$onRemove]?.(world, getStore(world, component), eid, reset);
		}

		// TODO: recursively disinherit
	} else {
		component[$onRemove]?.(world, getStore(world, component), eid, reset);
	}
};

/**
 * Removes multiple components from an entity.
 *
 * @param {World} world
 * @param {number} eid
 * @param {Component[]} components
 * @param {boolean} [reset=true]
 */
export const removeComponents = (world: World, eid: number, components: Component[]) => {
	components.forEach((component) => removeComponent(world, eid, component));
};
