import { $onAdd, $onRemove } from '../hooks/symbols';
import { defineHiddenProperty } from '../utils/defineHiddenProperty';
import { World } from '../world/types';
import { $createStore } from './symbols';
import { Component, OnRemoveFn, OnSetFn, WithContextFn, WithStoreFn } from './types';

export function withContext<Context>(context: Context): WithContextFn<Context> {
	return ((component: Component) => {
		Object.assign(component, context);
	}) as WithContextFn<Context>;
}

export function withStore<Store>(createStore: () => Store): WithStoreFn<Store> {
	return ((component: Component) => {
		defineHiddenProperty(component, $createStore, createStore);
	}) as WithStoreFn<Store>;
}

export function onSet<Store, Params, W extends World>(
	callback: (world: W, store: Store, eid: number, params: Params) => void
): OnSetFn<Store, Params> {
	return ((component: Component) => {
		defineHiddenProperty(component, $onAdd, callback);
	}) as OnSetFn<Store, Params>;
}

export function onRemove<Store, W extends World>(
	callback: (world: W, store: Store, eid: number, reset: boolean) => void
): OnRemoveFn<Store> {
	return ((component: Component) => {
		defineHiddenProperty(component, $onRemove, callback);
	}) as OnRemoveFn<Store>;
}
