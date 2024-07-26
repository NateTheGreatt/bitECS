import { Component } from '../component/types';
import { World } from '../world/types';
import { $withStore, $withContext } from './symbols';

export type ComponentOrWithParams<C extends Component = Component> =
	| C
	| [C, C extends Component<any, infer P> ? P : never];

export type WithStoreFn<Store, Params> = (component: Component) => void & { [$withStore]: true };
export type WithContextFn<Context> = (component: Component) => void & { [$withContext]: true };
export type OnAddFn<W extends World = World> = (world: W, eid: number) => void;
