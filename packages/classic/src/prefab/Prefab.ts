import { addComponent } from '../component/Component';
import { Component } from '../component/types';
import { defineHiddenProperties } from '../utils/defineHiddenProperty';
import { World } from '../world/types';
import { Prefab, addEntity } from '../entity/Entity';
import { $prefabComponents, $worldToPrefab } from './symbols';
import { PrefabToken } from './types';

export const definePrefab = (components: Component[] = []) => {
	const prefab = {};

	defineHiddenProperties(prefab, {
		[$prefabComponents]: components,
		[$worldToPrefab]: new Map(),
	});

	return prefab as PrefabToken;
};

export const registerPrefab = (world: World, prefab: PrefabToken) => {
	if (prefab[$worldToPrefab].has(world)) {
		return prefab[$worldToPrefab].get(world)!;
	}

	const eid = addPrefab(world);

	addComponents(world, prefab[$prefabComponents], eid);

	prefab[$worldToPrefab].set(world, eid);

	return eid;
};

export const addPrefab = (world: World) => {
	const eid = addEntity(world);

	addComponent(world, Prefab, eid);

	return eid;
};
