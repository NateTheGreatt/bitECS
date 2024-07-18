import { Component } from '../component/types';
import { PrefabNode } from '../prefab/types';
import { $onTargetRemoved } from '../relation/symbols';
import { RelationType } from '../relation/types';
import { World } from '../world/types';
import { $onAdd, $onRemove } from './symbols';

export function onAdd<Params>(
	prefab: PrefabNode<Params>,
	cb: (world: World, eid: number, params: Params) => void
): void;
export function onAdd<Store, Params>(
	component: Component<Store, Params>,
	cb: (world: World, store: Store, eid: number, params: Params) => void
): void;
export function onAdd<Store, Params>(
	relation: RelationType<Component<Store, Params>>,
	cb: (world: World, store: Store, eid: number, params: Params) => void
): void;
export function onAdd(subject: any, cb: any) {
	subject[$onAdd] = cb;
}

export function onRemove<Params>(
	prefab: PrefabNode<Params>,
	cb: (world: World, eid: number) => void
): void;
export function onRemove<Store, Params>(
	component: Component<Store, Params>,
	cb: (world: World, store: Store, eid: number, reset: boolean) => void
): void;
export function onRemove<Store, Params>(
	relation: RelationType<Component<Store, Params>>,
	cb: (world: World, store: Store, eid: number, reset: boolean) => void
): void;
export function onRemove(subject: any, cb: any) {
	subject[$onRemove] = cb;
}

export function onTargetRemoved(subject: RelationType<any>, cb: (world: World, eid: number) => void) {
	subject[$onTargetRemoved] = cb;
}
