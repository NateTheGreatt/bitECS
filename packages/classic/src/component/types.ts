import { $onAdd, $onRemove } from '../hooks/symbols';
import { QueryData } from '../query/types';
import { $isPairComponent, $relation, $pairTarget } from '../relation/symbols';
import { RelationTarget, RelationType } from '../relation/types';
import { World } from '../world/types';
import { $cleanupComponent, $setComponent, $store } from './symbols';

export type onAddCallback<TStore = any, TParams = any, TWorld extends World = World> = (
	world: TWorld,
	store: TStore,
	eid: number,
	params: TParams
) => void;

export type onRemoveCallback<TStore = any, TWorld extends World = World> = (
	world: TWorld,
	store: TStore,
	eid: number,
	reset: boolean
) => void;

export type Component = any;

export interface ComponentDefinition<Store = any, Params = any> {
	[$store]?: () => Store;
	[$setComponent]?: SetParams<Store, Params>;
	[$cleanupComponent]?: CleanupParams<Store>;
	[$isPairComponent]?: boolean;
	[$relation]?: RelationType<ComponentDefinition<Store>>;
	[$pairTarget]?: RelationTarget;
}

export interface ComponentNode {
	id: number;
	generationId: number;
	bitflag: number;
	ref: ComponentDefinition;
	store: any;
	set: SetParams<any, any> | null;
	cleanup: CleanupParams<any> | null;
	queries: Set<QueryData>;
	notQueries: Set<QueryData>;
	onAddCallbacks: onAddCallback[];
	onRemoveCallbacks: onRemoveCallback[];
}

export type SetParams<Store, Params, W extends World = World> = (
	world: W,
	store: Store,
	entity: number,
	params: Params
) => void;

export type CleanupParams<Store, W extends World = World> = (
	world: W,
	store: Store,
	entity: number,
	reset: boolean
) => void;

export type ComponentStore<T extends Component> = T extends ComponentDefinition<infer S> ? S : T;
