import { addChildren } from '../entity/Entity.js';
import { $entityComponents, $entityMasks } from '../entity/symbols.js';
import { $onAdd, $onRemove } from '../hooks/symbols.js';
import { ComponentOrWithParams } from '../hooks/types.js';
import { Prefab, registerPrefab } from '../prefab/Prefab.js';
import { $ancestors, $children, $prefabComponents } from '../prefab/symbols.js';
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
import { entityExists, incrementWorldBitflag } from '../world/World.js';
import { $bitflag } from '../world/symbols.js';
import { World } from '../world/types.js';
import { $componentCount, $componentMap, $createStore } from './symbols.js';
import {
	Component,
	ComponentInstance,
	OnRemoveFn,
	OnSetFn,
	WithContext,
	WithStoreFn,
} from './types.js';

/**
 * Retrieves the store associated with the specified component in the given world.
 *
 * @param {World} world - The world to retrieve the component store from.
 * @param {Component} component - The component to get the store for.
 * @returns {Store} The store associated with the specified component.
 */
export const getStore = <Store>(world: World, component: Component<Store>) => {
	if (!world[$componentMap].has(component)) registerComponent(world, component);

	return world[$componentMap].get(component)?.store as Store;
};

/**
 * Sets the store associated with the specified component in the given world.
 *
 * @param {World} world - The world to set the component store in.
 * @param {Component} component - The component to set the store for.
 * @param {Store} store - The store to associate with the component.
 */
export const setStore = <Store>(world: World, component: Component<Store>, store: Store) => {
	if (!world[$componentMap].has(component)) registerComponent(world, component);

	const node = world[$componentMap].get(component)!;
	node.store = store;
};

/**
 * Defines a new component store.
 *
 * @param {object} schema
 *
 * @returns {object}
 */
export function defineComponent<Store, Params = void, Context extends {} = {}>(
	...options: (
		| WithStoreFn<Store>
		| OnSetFn<Store, Params>
		| OnRemoveFn<Store>
		| WithContext<Context>
	)[]
): Component<Store, Params> & Context {
	const component = {} as Component<Store, Params>;
	for (const option of options) option(component);

	return component as Component<Store, Params> & Context;
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
	const instance: ComponentInstance = {
		id: world[$componentCount]++,
		generationId: world[$entityMasks].length - 1,
		bitflag: world[$bitflag],
		ref: component,
		store: component[$createStore]?.() ?? component,
		queries,
		notQueries,
	};

	world[$componentMap].set(component, instance);

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
 * @param {number} eid
 * @param {Component} component
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
	const prefabs = new Map<PrefabNode, any>();
	const components = new Map<Component, any>();
	const children: PrefabNode[] = [];

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

		addComponentInternal(world, eid, component);
		if (component[$relation] && component[$pairTarget] !== Wildcard) {
			component[$relation][$onAdd]?.(world, getStore(world, component), eid, params);
		} else {
			component[$onAdd]?.(world, getStore(world, component), eid, params);
		}
	}

	for (const tuple of prefabs.entries()) {
		const prefab = tuple[0];
		const params = tuple[1];
		registerPrefab(world, prefab);

		addComponentInternal(world, eid, IsA(prefab));
		prefab[$onAdd]?.(world, eid, params);
	}

	addChildren(world, eid, children);
};

export const addComponentInternal = (world: World, eid: number, component: Component) => {
	// Exit early if the entity already has the component.
	if (hasComponent(world, eid, component)) return;

	// Register the component with the world if it isn't already.
	if (!world[$componentMap].has(component)) registerComponent(world, component);

	const instance = world[$componentMap].get(component)!;
	const { generationId, bitflag, queries } = instance;

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

	const instance = world[$componentMap].get(component)!;
	const { generationId, bitflag, queries } = instance;

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
