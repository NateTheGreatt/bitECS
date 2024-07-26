import { Component } from '../component/types';
import { PrefabNode } from '../prefab/types';
import { $onTargetRemoved } from '../relation/symbols';
import { RelationType } from '../relation/types';
import { World } from '../world/types';
import { $onAdd, $onReset } from './symbols';

export function onAdd<Params, W extends World = World>(
	prefab: PrefabNode<Params>,
	cb: (world: W, eid: number, params: Params) => void
): void;
export function onAdd<Store, Params, W extends World = World>(
	component: Component<Store, Params>,
	cb: (world: W, store: Store, eid: number, params: Params) => void
): void;
export function onAdd<Store, Params, W extends World = World>(
	relation: RelationType<Component<Store, Params>>,
	cb: (world: W, store: Store, eid: number, params: Params) => void
): void;
export function onAdd(subject: any, cb: any) {
	subject[$onAdd] = cb;
}

export function onRemove<Params, W extends World = World>(
	prefab: PrefabNode<Params>,
	cb: (world: W, eid: number) => void
): void;
export function onRemove<Store, Params, W extends World = World>(
	component: Component<Store, Params>,
	cb: (world: W, store: Store, eid: number, reset: boolean) => void
): void;
export function onRemove<Store, Params, W extends World = World>(
	relation: RelationType<Component<Store, Params>>,
	cb: (world: W, store: Store, eid: number, reset: boolean) => void
): void;
export function onRemove(subject: any, cb: any) {
	subject[$onReset] = cb;
}

export function onTargetRemoved<W extends World = World>(
	subject: RelationType<any>,
	cb: (world: W, eid: number) => void
) {
	subject[$onTargetRemoved] = cb;
}
