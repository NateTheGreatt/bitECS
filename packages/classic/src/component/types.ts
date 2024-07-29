import { QueryData } from '../query/types';
import { $isPairComponent, $pairTarget, $relation } from '../relation/symbols';
import { RelationTarget, RelationType } from '../relation/types';
import { $createStore, $onAdd, $onRemove, $onReset, $onSet } from './symbols';

export type Component<Store = any, Params = any> = {
	name?: string;
	[$onSet]?: (world: any, store: Store, eid: number, params: Params) => void;
	[$onReset]?: (world: any, store: Store, eid: number) => void;
	[$onAdd]?: (world: any, eid: number) => void;
	[$onRemove]?: (world: any, eid: number) => void;
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

export type ComponentOrWithParams<C extends Component = Component> =
	| C
	| [C, C extends Component<any, infer P> ? P : never];
