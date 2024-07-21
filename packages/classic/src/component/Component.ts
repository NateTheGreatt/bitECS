import { addChildren } from '../entity/Entity.js';
import { $entityComponents, $entityMasks } from '../entity/symbols.js';
import { $onAdd, $onRemove } from '../hooks/symbols.js';
import { ComponentOrWithParams } from '../hooks/types.js';
import { Prefab, registerPrefab } from '../prefab/Prefab.js';
import { $children, $ancestors, $prefabComponents, $worldToEid } from '../prefab/symbols.js';
import { PrefabNode } from '../prefab/types.js';
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
import {
	$cleanupComponent,
	$componentCount,
	$componentMap,
	$setComponent,
	$store,
} from './symbols.js';
import {
	CleanupParams,
	Component,
	ComponentDefinition,
	ComponentNode,
	ComponentStore,
	SetParams,
} from './types.js';

/**
 * Retrieves the store associated with the specified component in the given world.
 *
 * @param {World} world - The world to retrieve the component store from.
 * @param {ComponentDefinition} component - The component to get the store for.
 * @returns {Store} The store associated with the specified component.
 */
export const getStore = <C>(world: World, component: C) => {
	if (!world[$componentMap].has(component)) registerComponent(world, component);

	return world[$componentMap].get(component as any)?.store as ComponentStore<C>;
};

/**
 * Defines a new component store.
 *
 * @param {object} schema
 *
 * @returns {object}
 */
export function defineComponent<Store, Params = never, W extends World = World>(
	store: () => Store,
	set?: SetParams<Store, Params, W>,
	cleanup?: CleanupParams<Store, W>
): ComponentDefinition<Store, Params> {
	const component = {} as ComponentDefinition<Store, Params>;

	defineHiddenProperties(component, {
		[$store]: store,
		[$setComponent]: set ?? null,
		[$cleanupComponent]: cleanup ?? null,
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
		store: component[$store]?.() ?? component,
		set: component[$setComponent] ?? null,
		cleanup: component[$cleanupComponent] ?? null,
		queries,
		notQueries,
		onAddCallbacks: [],
		onRemoveCallbacks: [],
	};

	world[$componentMap].set(component, componentNode);

	incrementWorldBitflag(world);
};

/**
 * Registers multiple components with a world.
 *
 * @param {World} world
 * @param {ComponentDefinition[]} components
 */
export const registerComponents = (world: World, components: ComponentDefinition[]) => {
	components.forEach((component) => registerComponent(world, component));
};

/**
 * Checks if an entity has a component.
 *
 * @param {World} world
 * @param {number} eid
 * @param {ComponentDefinition} component
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
 * @param {number} eid
 * @param {ComponentDefinition} component
 * @param {boolean} [reset=false]
 */
export const addComponent = (world: World, eid: number, arg: ComponentOrWithParams) => {
	if (!entityExists(world, eid)) {
		throw new Error('bitECS - entity does not exist in the world.');
	}

	// addComponentsInternal(world, eid, [arg]);

	let component: ComponentDefinition;
	let params: any;

	// Check if it's a params object or a component.
	if (typeof arg === 'object' && 'target' in arg) {
		component = arg.target;
		params = arg.params;
	} else {
		component = arg;
	}

	// Exit early if the entity already has the component.
	if (hasComponent(world, eid, component)) return;

	// Register the component with the world if it isn't already.
	if (!world[$componentMap].has(component)) registerComponent(world, component);

	const componentNode = world[$componentMap].get(component)!;
	const { generationId, bitflag, queries } = componentNode;

	// Add bitflag to entity bitmask.
	world[$entityMasks][generationId][eid] |= bitflag;

	if (!hasComponent(world, eid, Prefab)) {
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

	// Call set callback if it exists.
	componentNode.set?.(world, getStore(world, component), eid, params);
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
	const prefabs = new Map<PrefabNode, any>();
	const components = new Map<ComponentDefinition, any>();
	const children: PrefabNode[] = [];

	/*
	 * Build a component/params map to avoid adding components
	 * repeatedly and to allow params overriding
	 */
	for (const arg of args) {
		let component: ComponentDefinition;
		let params: any;
		// Check if it's a params object or a component
		if ('target' in arg) {
			component = arg.target;
			params = arg.params;
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

		// If inheriting a prefab, go through its ancestors to resolve
		// component params and children to be added
		if (component[$relation] === IsA) {
			let prefab = component[$pairTarget] as PrefabNode;

			// Set the prefab instead of the relation so that we can call its onAdd hook
			prefabs.set(prefab, params);

			if (prefab[$children]) {
				children.push(...prefab[$children]);
			}
			const ancestors = prefab[$ancestors];

			// Go trough each ancestor
			// Add its components and params
			for (const ancestor of ancestors) {
				prefabs.set(ancestor, null);

				for (const prefabComponent of ancestor[$prefabComponents]) {
					if (Array.isArray(prefabComponent)) {
						const component = prefabComponent[0];
						const params = prefabComponent[1];

						components.set(component, params);
					} else if (!components.has(prefabComponent)) {
						// check because only non-null parameters should override
						components.set(prefabComponent, null);
					}
				}
			}
		} else {
			components.set(component, null);
		}
	}

	// prefabs onAdd is called after all components onAdd
	for (const tuple of components.entries()) {
		const component = tuple[0];
		const params = tuple[1];

		addComponentInternal(world, eid, component, params);

		// if (component[$relation] && component[$pairTarget] !== Wildcard) {
		// 	component[$relation][$onAdd]?.(world, getStore(world, component), eid, params);
		// } else {
		// 	component[$onAdd]?.(world, getStore(world, component), eid, params);
		// }
	}

	for (const tuple of prefabs.entries()) {
		const prefab = tuple[0];
		const params = tuple[1];
		registerPrefab(world, prefab);

		addComponentInternal(world, eid, IsA(prefab), params);
		prefab[$onAdd]?.(world, eid, params);
	}

	addChildren(world, eid, children);
};

export const addComponentInternal = (
	world: World,
	eid: number,
	component: ComponentDefinition,
	params: any
) => {
	// Exit early if the entity already has the component.
	if (hasComponent(world, eid, component)) return;

	// Register the component with the world if it isn't already.
	if (!world[$componentMap].has(component)) registerComponent(world, component);

	const componentNode = world[$componentMap].get(component)!;
	const { generationId, bitflag, queries } = componentNode;

	// Add bitflag to entity bitmask.
	world[$entityMasks][generationId][eid] |= bitflag;

	if (!hasComponent(world, eid, Prefab)) {
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

	// Call set callback if it exists.
	componentNode.set?.(world, getStore(world, component), eid, params);
};

/**
 * Removes a component from an entity.
 *
 * @param {World} world
 * @param {number} eid
 * @param {ComponentDefinition} component
 * @param {boolean} [reset=true]
 */
export const removeComponent = (
	world: World,
	eid: number,
	component: ComponentDefinition,
	reset = true
) => {
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
			(component[$pairTarget] as PrefabNode)[$onRemove]?.(world, eid, reset);
		} else if (component[$pairTarget] !== Wildcard) {
			// component[$relation]![$onRemove]?.(world, getStore(world, component), eid, reset);
		}

		// TODO: recursively disinherit
	} else {
		// component[$onRemove]?.(world, getStore(world, component), eid, reset);
		componentNode.cleanup?.(world, getStore(world, component), eid, reset);
	}
};

/**
 * Removes multiple components from an entity.
 *
 * @param {World} world
 * @param {number} eid
 * @param {ComponentDefinition[]} components
 * @param {boolean} [reset=true]
 */
export const removeComponents = (world: World, eid: number, components: ComponentDefinition[]) => {
	components.forEach((component) => removeComponent(world, eid, component));
};
