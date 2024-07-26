import { $onReset, $onSet } from '../hooks/symbols';
import { defineHiddenProperty } from '../utils/defineHiddenProperty';
import { World } from '../world/types';
import { $createStore } from './symbols';
import { Component, OnAddFn, WithContextFn, WithStoreFn } from './types';

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
