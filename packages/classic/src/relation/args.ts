import { Component } from '../component/types';
import { RelationOptions } from './types';

export const withComponentSymbol = Symbol('withComponent');
export const withOptionsSymbol = Symbol('withOptions');

export type WithComponent<T extends Component> = {
	__type: typeof withComponentSymbol;
	componentFactory: () => T;
};
export type WithOptions = {
	__type: typeof withOptionsSymbol;
	options: Partial<RelationOptions>;
};

// Helper functions to create branded types
export function withComponent<T extends Component>(componentFactory: () => T): WithComponent<T> {
	return { __type: withComponentSymbol, componentFactory };
}

export function withOptions(options: Partial<RelationOptions>): WithOptions {
	return { __type: withOptionsSymbol, options };
}
