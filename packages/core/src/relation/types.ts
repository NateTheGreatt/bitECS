import { $onReset, $onSet } from '../component/symbols';
import { PrefabNode } from '../prefab/types';
import { World } from '../world/types';
import {
	$autoRemoveSubject,
	$component,
	$exclusiveRelation,
	$onTargetRemoved,
	$pairsMap,
} from './symbols';

export type RelationTarget = number | string | PrefabNode;

export type RelationType<T> = T & {
	[$pairsMap]: Map<number | string, T>;
	[$component]: () => T;
	[$exclusiveRelation]: boolean;
	[$autoRemoveSubject]: boolean;
	[$onSet]: (world: World, eid: number, params: any) => void;
	[$onReset]: (world: World, eid: number) => void;
	[$onTargetRemoved]: (world: World, subject: number, target: number) => void;
} & ((target: RelationTarget) => T);

export type RelationOptions = {
	exclusive: boolean;
	autoRemoveSubject: boolean;
};
