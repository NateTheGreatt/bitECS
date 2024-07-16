import { Component } from '../component/types';
import { $onAdd, $onRemove } from '../hooks/symbols';
import { World } from '../world/types';
import { $children, $hierarchy, $prefabComponents, $worldToPrefab } from './symbols';

export type Prefab<Params = void> = {
	[$prefabComponents]: Component[];
	[$worldToPrefab]: Map<World, number>;
	[$onAdd]: (world: any, eid: number, params?: Params) => void;
	[$onRemove]: (world: any, eid: number, reset?: boolean) => void;
	[$children]: Prefab[];
	[$hierarchy]: Prefab[];
};
