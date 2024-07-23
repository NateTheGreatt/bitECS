import { Component } from '../component/types';
import { $onAdd, $onRemove } from '../hooks/symbols';
import { World } from '../world/types';
import { $children, $ancestors, $prefabComponents, $worldToEid } from './symbols';

export type PrefabNode<Params = void> = {
	[$prefabComponents]: Component[];
	[$worldToEid]: Map<World, number>;
	[$onAdd]: (world: any, eid: number, params?: Params) => void;
	[$onRemove]: (world: any, eid: number, reset?: boolean) => void;
	[$children]: PrefabNode[];
	[$ancestors]: PrefabNode[];
};
