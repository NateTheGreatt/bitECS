import { QueryData } from '../query/types';
import { $isPairComponent, $relation, $pairTarget } from '../relation/symbols';
import { RelationTarget, RelationType } from '../relation/types';
import { $store } from './symbols';

export type Component<Store = any> = {
	name?: string;
	// [$onAdd]?: (world: any, store: Store, eid: number, params: Params) => void;
	// [$onRemove]?: (world: any, store: Store, eid: number, reset: boolean) => void;
	[$store]?: () => Store;
	[$isPairComponent]?: boolean;
	[$relation]?: RelationType<Component<Store>>;
	[$pairTarget]?: RelationTarget;
};

export interface ComponentNode {
	id: number;
	generationId: number;
	bitflag: number;
	ref: Component;
	store: any;
	queries: Set<QueryData>;
	notQueries: Set<QueryData>;
}
