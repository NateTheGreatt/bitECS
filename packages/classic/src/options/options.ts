import { Component } from '../component/types';
import { PrefabNode } from '../prefab/types';
import { $createStore, $onReset, $onSet } from '../options/symbols';
import { defineHiddenProperty } from '../utils/defineHiddenProperty';
import { World } from '../world/types';
import { WithContextFn, WithStoreFn } from './types';

export function withContext<Context>(context: Context): WithContextFn<Context> {
	return ((component: Component) => {
		Object.assign(component, context);
	}) as WithContextFn<Context>;
}

type WithStoreOptions<Store, Params, W extends World> = {
	onSet?: (world: W, store: Store, eid: number, params: Params) => void;
	onReset?: (world: W, store: Store, eid: number) => void;
};

export function withStore<Store, Params = unknown, W extends World = World>(
	createStore: (store: any) => Store,
	options: WithStoreOptions<Store, Params, W> = {}
): WithStoreFn<Store, Params> {
	return ((component: Component) => {
		if (!component[$createStore]) defineHiddenProperty(component, $createStore, []);
		component[$createStore]!.push(createStore);

		if (options.onSet) defineHiddenProperty(component, $onSet, options.onSet);
		if (options.onReset) defineHiddenProperty(component, $onReset, options.onReset);
	}) as WithStoreFn<Store, Params>;
}

export function withParams<P extends PrefabNode>(
	prefab: P,
	params: P extends PrefabNode<infer Params> ? Params : never
): [P, P extends PrefabNode<infer Params> ? Params : never];
export function withParams<C extends Component>(
	component: C,
	params: C extends Component<any, infer Params> ? Params : never
): [C, C extends Component<any, infer Params> ? Params : never];
export function withParams(a: any, b: any) {
	return [a, b];
}
