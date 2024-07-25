import { $onAdd, $onRemove } from '../hooks/symbols';
import { QueryData } from '../query/types';
import { $isPairComponent, $relation, $pairTarget } from '../relation/symbols';
import { RelationTarget, RelationType } from '../relation/types';
import { $createStore, $onSet, $withContext, $withStore } from './symbols';

export type Component<Store = any, Params = any> = {
	name?: string;
	[$onAdd]?: (world: any, store: Store, eid: number, params: Params) => void;
	[$onRemove]?: (world: any, store: Store, eid: number, reset: boolean) => void;
	[$createStore]?: () => Store;
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
export type WithStoreFn<Store> = (component: Component) => void & { [$withStore]: true };
export type OnSetFn<Store, Params> = (component: Component) => void & { [$onSet]: true };
export type OnRemoveFn<Store> = (component: Component) => void & { [$onRemove]: true };
export type WithContextFn<Context> = (component: Component) => void & { [$withContext]: true };
