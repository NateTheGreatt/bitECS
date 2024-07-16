import { $onAdd, $onRemove } from '../hooks/symbols';
import { Prefab } from '../prefab/types';
import { World } from '../world/types';
import {
	$autoRemoveSubject,
	$exclusiveRelation,
	$component,
	$onTargetRemoved,
	$pairsMap,
} from './symbols';

export type RelationTarget = number | string | Prefab;

export type RelationType<T> = T & {
	[$pairsMap]: Map<number | string, T>;
	[$component]: () => T;
	[$exclusiveRelation]: boolean;
	[$autoRemoveSubject]: boolean;
	[$onAdd]: (world: World, eid: number, params: any) => void;
	[$onRemove]: (world: World, eid: number, reset: boolean) => void;
	[$onTargetRemoved]: (world: World, subject: number, target: number) => void;
} & ((target: RelationTarget) => T);
