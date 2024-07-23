import { World } from '../world/types';

export const withContextSymbol = Symbol('withContext');
export const withStoreSymbol = Symbol('withStore');
export const onAddSymbol = Symbol('onAdd');
export const onRemoveSymbol = Symbol('onRemove');

export type WithContext<Context> = { __type: typeof withContextSymbol; context: Context };
export type WithStore<Store> = { __type: typeof withStoreSymbol; store: () => Store };
export type OnAdd<Store, Params> = {
	__type: typeof onAddSymbol;
	onAdd: (world: any, store: Store, eid: number, params: Params) => void;
};
export type OnRemove<Store> = {
	__type: typeof onRemoveSymbol;
	onRemove: (world: any, store: Store, eid: number, reset: boolean) => void;
};

// Helper functions to create branded types
export function withContext<Context>(context: Context): WithContext<Context> {
	return { __type: withContextSymbol, context };
}

export function withStore<Store>(store: () => Store): WithStore<Store> {
	return { __type: withStoreSymbol, store };
}

export function onAdd<Store, Params, W extends World>(
	onAdd: (world: W, store: Store, eid: number, params: Params) => void
): OnAdd<Store, Params> {
	return { __type: onAddSymbol, onAdd };
}

export function onRemove<Store, W extends World>(
	onRemove: (world: W, store: Store, eid: number, reset: boolean) => void
): OnRemove<Store> {
	return { __type: onRemoveSymbol, onRemove };
}
