import { addComponent, addComponents } from '../component/Component';
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

	addComponents(world, eid, ...prefab[$prefabComponents]);

	prefab[$worldToPrefab].set(world, eid);

	return eid;
};

export const registerPrefabs = (world: World, prefabs: PrefabToken[]) =>
	prefabs.map((prefab) => registerPrefab(world, prefab));

export const addPrefab = (world: World) => {
	const eid = addEntity(world, Prefab);

	return eid;
};
