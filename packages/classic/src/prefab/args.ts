import { ComponentOrWithParams } from '../hooks/types';
import { World } from '../world/types';

export const withComponentsSymbol = Symbol('withComponents');
export const onInstantiateSymbol = Symbol('onInstantiate');
export const onDeInstantiateSymbol = Symbol('onDeInstantiate');

export type WithComponents = {
	__type: typeof withComponentsSymbol;
	components: ComponentOrWithParams[];
};
export type OnInstantiate<Params> = {
	__type: typeof onInstantiateSymbol;
	onInstantiate: (world: any, eid: number, params: Params) => void;
};
export type OnDeIstantiate = {
	__type: typeof onDeInstantiateSymbol;
	onDeInstantiate: (world: any, eid: number) => void;
};

export function withComponents(...components: ComponentOrWithParams[]): WithComponents {
	return { __type: withComponentsSymbol, components };
}

export function onInstantiate<Params, W extends World>(
	onInstantiate: (world: W, eid: number, params: Params) => void
): OnInstantiate<Params> {
	return { __type: onInstantiateSymbol, onInstantiate };
}

export function onDeInstantiate<W extends World>(
	onDeInstantiate: (world: W, eid: number) => void
): OnDeIstantiate {
	return { __type: onDeInstantiateSymbol, onDeInstantiate };
}
