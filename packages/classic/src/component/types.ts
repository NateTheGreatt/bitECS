import { $createStore, $onReset, $onSet } from '../options/symbols';
import { ComponentOptions, WithContextFn, WithStoreFn } from '../options/types';
import { QueryData } from '../query/types';
import { $isPairComponent, $pairTarget, $relation } from '../relation/symbols';
import { RelationTarget, RelationType } from '../relation/types';

export type Component<Store = any, Params = any> = {
	name?: string;
	[$onSet]?: ((world: any, store: Store, eid: number, params: Params) => void)[];
	[$onReset]?: ((world: any, store: Store, eid: number) => void)[];
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

export type MergeStores<T extends ComponentOptions> = T extends [infer First, ...infer Rest]
	? Rest extends ComponentOptions
		? First extends WithStoreFn<infer S, any>
			? S & MergeStores<Rest>
			: MergeStores<Rest>
		: unknown
	: unknown;

export type MergeParams<T extends ComponentOptions> = T extends [infer First, ...infer Rest]
	? Rest extends ComponentOptions
		? First extends WithStoreFn<any, infer P>
			? P & MergeParams<Rest>
			: MergeParams<Rest>
		: unknown
	: unknown;

export type MergeContexts<T extends ComponentOptions> = T extends [infer First, ...infer Rest]
	? Rest extends ComponentOptions
		? First extends WithContextFn<infer C>
			? C & MergeContexts<Rest>
			: MergeContexts<Rest>
		: unknown
	: unknown;
