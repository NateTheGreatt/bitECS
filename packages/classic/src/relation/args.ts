import { Component } from '../component/types';
import { World } from '../world/types';
import { RelationOptions } from './types';

export const withComponentSymbol = Symbol('withComponent');
export const withOptionsSymbol = Symbol('withOptions');
export const onTargetRemovedSymbol = Symbol('onTargetRemoved');

export type WithComponent<T extends Component> = {
	__type: typeof withComponentSymbol;
	componentFactory: () => T;
};
export type WithOptions = {
	__type: typeof withOptionsSymbol;
	options: Partial<RelationOptions>;
};
export type OnTargetRemoved = {
	__type: typeof onTargetRemovedSymbol;
	onTargetRemoved: (world: any, eid: number) => void;
};

// Helper functions to create branded types
export function withComponent<T extends Component>(componentFactory: () => T): WithComponent<T> {
	return { __type: withComponentSymbol, componentFactory };
}

export function withOptions(options: Partial<RelationOptions>): WithOptions {
	return { __type: withOptionsSymbol, options };
}

export function onTargetRemoved<W extends World>(
	cb: (world: W, eid: number) => void
): OnTargetRemoved {
	return { __type: onTargetRemovedSymbol, onTargetRemoved: cb };
}
