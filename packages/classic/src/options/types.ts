import { Component } from '../component/types';
import { World } from '../world/types';
import { $withStore, $withContext, $onAdd, $option } from './symbols';

export type ComponentOrWithParams<C extends Component = Component> =
	| C
	| [C, C extends Component<any, infer P> ? P : never];

export type ComponentOptions = (WithStoreFn<any, any> | WithContextFn<any>)[];

export type WithStoreFn<Store, Params> = (
	component: Component
) => void & { [$option]: true; [$withStore]: true };

export type WithContextFn<Context> = (
	component: Component
) => void & { [$option]: true; [$withContext]: true };

export type OnAddFn<W extends World = World> = (
	world: W,
	eid: number
) => void & { [$option]: true; [$onAdd]: true };
