import { PrefabToken } from '../prefab/types';
import { World } from '../world/types';
import {
	$autoRemoveSubject,
	$exclusiveRelation,
	$initStore,
	$onTargetRemoved,
	$pairsMap,
} from './symbols';

export type OnTargetRemovedCallback = (world: World, subject: number, target: number) => void;

export type RelationTarget = number | string | PrefabToken;

export type RelationType<T> = T & {
	[$pairsMap]: Map<number | string, T>;
	[$initStore]: () => T;
	[$exclusiveRelation]: boolean;
	[$autoRemoveSubject]: boolean;
	[$onTargetRemoved]: OnTargetRemovedCallback;
} & ((target: RelationTarget) => T);
