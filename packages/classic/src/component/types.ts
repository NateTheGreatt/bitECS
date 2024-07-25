import { $onRemove, $onSet } from '../hooks/symbols';
import { QueryData } from '../query/types';
import { $isPairComponent, $pairTarget, $relation } from '../relation/symbols';
import { RelationTarget, RelationType } from '../relation/types';
import { $createStore, $withContext, $withStore } from './symbols';

export type Component<Store = any, Params = any> = {
	name?: string;
	[$onSet]?: (world: any, store: Store, eid: number, params: Params) => void;
	[$onRemove]?: (world: any, store: Store, eid: number, reset: boolean) => void;
	[$createStore]?: ((store: any) => Store)[];
	[$isPairComponent]?: boolean;
	[$relation]?: RelationType<Component<Store>>;
	[$pairTarget]?: RelationTarget;
};

export interface ComponentInstance {
	id: number;
	generationId: number;
	bitflag: number;
	ref: Component;
	store: any;
	queries: Set<QueryData>;
	notQueries: Set<QueryData>;
}

// Options
export type WithStoreFn<Store, Params> = (component: Component) => void & { [$withStore]: true };
export type WithContextFn<Context> = (component: Component) => void & { [$withContext]: true };

export type ComponentOptions = (WithStoreFn<any, any> | WithContextFn<any>)[];

export type MergeStores<T extends ComponentOptions> = T extends [
	WithStoreFn<infer S, any>,
	...infer Rest
]
	? Rest extends WithStoreFn<any, any>[]
		? S & MergeStores<Rest>
		: S
	: unknown;

export type MergeParams<T extends ComponentOptions> = T extends [
	WithStoreFn<any, infer P>,
	...infer Rest
]
	? Rest extends WithStoreFn<any, any>[]
		? P & MergeParams<Rest>
		: P
	: unknown;

export type MergeContexts<T extends ComponentOptions> = T extends [
	WithContextFn<infer C>,
	...infer Rest
]
	? Rest extends WithContextFn<any>[]
		? C & MergeContexts<Rest>
		: C
	: unknown;
