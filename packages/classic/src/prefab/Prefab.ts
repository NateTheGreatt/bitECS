import { Component } from '../component/types';
import { ComponentOrWithParams } from '../hooks/types';
import { ChildOf, IsA } from '../relation/Relation';
import { $isPairComponent, $relation, $pairTarget } from '../relation/symbols';
import { defineHiddenProperties } from '../utils/defineHiddenProperty';
import { $children, $hierarchy, $prefabComponents, $worldToPrefab } from './symbols';
import { Prefab } from './types';

export const definePrefab = <Params = void>(...args: ComponentOrWithParams[]) => {
	const prefab = {} as Prefab;

	// Arrange prefabs and components separately
	// prefabs will be used to build the hierarchy
	const prefabs: Prefab[] = [];
	const components: ComponentOrWithParams[] = [];
	for (const arg of args) {
		let component: Component;
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
				const target = component[$pairTarget] as Prefab;
				prefabs.push(target);
			} else if (relation === ChildOf) {
				const target = component[$pairTarget] as Prefab;
				if (typeof target === 'object' && $worldToPrefab in target) {
					target[$children].push(prefab);
				}
			}
		} else {
			components.push(arg);
		}
	}

	const hierarchy = [] as Prefab[];
	for (const p of prefabs) {
		hierarchy.push(...p[$hierarchy]);
	}

	hierarchy.push(prefab);

	defineHiddenProperties(prefab, {
		[$prefabComponents]: components,
		[$worldToPrefab]: new Map(),
		[$hierarchy]: hierarchy,
		[$children]: [],
	});

	return prefab as Prefab<Params>;
};
