import { ComponentDefinition } from '../component/types';
import { addEntity } from '../entity/Entity';
import { ComponentOrWithParams } from '../hooks/types';
import { ChildOf, IsA } from '../relation/Relation';
import { $isPairComponent, $relation, $pairTarget } from '../relation/symbols';
import { defineHiddenProperties } from '../utils/defineHiddenProperty';
import { $eidToPrefab } from '../world/symbols';
import { World } from '../world/types';
import { $children, $ancestors, $prefabComponents, $worldToEid } from './symbols';
import { PrefabNode } from './types';

export const Prefab = {};

/**
 * Defines a prefab, which is a reusable collection of components that can be added to an entity.
 *
 * @param args - An array of components or component-parameter pairs that make up the prefab.
 * @returns A prefab object that can be used to create new entities with the specified components.
 */
export const definePrefab = <Params = void>(...args: ComponentOrWithParams[]) => {
	const prefab = {} as PrefabNode;

	// Arrange prefabs and components separately
	// prefabs will be used to build the ancestors list
	const prefabs: PrefabNode[] = [];
	const components: ComponentOrWithParams[] = [];
	for (const arg of args) {
		let component: ComponentDefinition;
		let params: any;
		if (Array.isArray(arg)) {
			component = arg[0];
			params = arg[1];
		} else {
			component = arg;
		}

		if (component[$isPairComponent]) {
			const relation = component[$relation]!;

			if (relation === IsA) {
				const target = component[$pairTarget] as PrefabNode;
				prefabs.push(target);
			} else if (relation === ChildOf) {
				const target = component[$pairTarget] as PrefabNode;
				if (typeof target === 'object' && $worldToEid in target) {
					target[$children].push(prefab);
				}
			}
		} else {
			components.push(arg);
		}
	}

	const ancestors = [] as PrefabNode[];
	for (const p of prefabs) {
		ancestors.push(...p[$ancestors]);
	}

	ancestors.push(prefab);

	defineHiddenProperties(prefab, {
		[$prefabComponents]: components,
		[$worldToEid]: new Map(),
		[$ancestors]: ancestors,
		[$children]: [],
	});

	return prefab as PrefabNode<Params>;
};

/**
 * Registers a prefab in the specified world and returns its entity ID (EID).
 *
 * If the prefab has already been registered in the world, this function will return the existing EID.
 * Otherwise, it will create a new prefab entity in the world with the prefab's components and return the new EID.
 *
 * @param world - The world to register the prefab in.
 * @param prefab - The prefab to register.
 * @returns The entity ID (EID) of the registered prefab in the specified world.
 */
export const registerPrefab = (world: World, prefab: PrefabNode) => {
	if (prefab[$worldToEid].has(world)) {
		return prefab[$worldToEid].get(world)!;
	}

	const eid = addEntity(world, Prefab, ...prefab[$prefabComponents]);

	prefab[$worldToEid].set(world, eid);
	world[$eidToPrefab].set(eid, prefab);

	return eid;
};

/**
 * Gets the entity ID (EID) for the given prefab in the specified world.
 *
 * @param world - The world to get the prefab EID from.
 * @param prefab - The prefab to get the EID for.
 * @returns The entity ID for the given prefab in the specified world.
 */
export const getPrefabEid = (world: World, prefab: PrefabNode) => prefab[$worldToEid].get(world);

/**
 * Gets the prefab matching this entity ID.
 *
 * @param world - The world to get the prefab EID from.
 * @param prefab - The prefab to get the EID for.
 * @returns The entity ID for the given prefab in the specified world.
 */
export const getPrefab = (world: World, eid: number) => world[$eidToPrefab].get(eid);
