import { Component } from '../component/types';
import { World } from '../world/types';
import { $prefabComponents, $worldToPrefab } from './symbols';

export type PrefabToken = {
	[$prefabComponents]: Component[];
	[$worldToPrefab]: Map<World, number>;
};
