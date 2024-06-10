import { World, getEntityComponents, registerPrefab } from '..';
import { $schema } from '../component/symbols';
import { $worldToPrefab } from '../prefab/symbols';
import { defineHiddenProperty } from '../utils/defineHiddenProperty';
import {
	$pairsMap,
	$isPairComponent,
	$relation,
	$pairTarget,
	$onTargetRemoved,
	$autoRemoveSubject,
	$exclusiveRelation,
} from './symbols';
import { OnTargetRemovedCallback, RelationTarget, RelationType } from './types';

function createOrGetRelationComponent<T>(
	relation: (target: RelationTarget) => T,
	initStore: () => T,
	pairsMap: Map<any, T>,
	target: RelationTarget
) {
	if (!pairsMap.has(target)) {
		const component = initStore();
		defineHiddenProperty(component, $isPairComponent, true);
		defineHiddenProperty(component, $relation, relation);
		defineHiddenProperty(component, $pairTarget, target);
		pairsMap.set(target, component);
	}

	return pairsMap.get(target)!;
}

export const defineRelation = <T>(options?: {
	initStore?: () => T;
	exclusive?: boolean;
	autoRemoveSubject?: boolean;
	onTargetRemoved?: OnTargetRemovedCallback;
}): RelationType<T> => {
	const initStore = options?.initStore || ((() => ({})) as () => T);
	const pairsMap = new Map();
	const relation = function (target: RelationTarget) {
		if (target === undefined) throw Error('Relation target is undefined');
		if (target === '*') target = Wildcard;
		return createOrGetRelationComponent<T>(relation, initStore, pairsMap, target);
	};
	defineHiddenProperty(relation, $pairsMap, pairsMap);
	defineHiddenProperty(relation, $schema, initStore);
	defineHiddenProperty(relation, $exclusiveRelation, options && options.exclusive);
	defineHiddenProperty(relation, $autoRemoveSubject, options && options.autoRemoveSubject);
	defineHiddenProperty(relation, $onTargetRemoved, options ? options.onTargetRemoved : undefined);
	return relation as RelationType<T>;
};

export const Pair = <T>(relation: RelationType<T>, target: RelationTarget): T => {
	if (relation === undefined) throw Error('Relation is undefined');
	if (target === undefined) throw Error('Relation target is undefined');
	if (target === '*') target = Wildcard;

	const pairsMap = relation[$pairsMap];
	const schema = relation[$schema];

	return createOrGetRelationComponent<T>(relation, schema, pairsMap, target);
};

export const Wildcard: RelationType<any> | string = defineRelation();
export const IsA: RelationType<any> = defineRelation();

export const getRelationTargets = (world: World, relation: RelationType<any>, eid: number) => {
	const components = getEntityComponents(world, eid);
	const targets = [];
	for (const c of components) {
		if (c[$relation] === relation && c[$pairTarget] !== Wildcard) {
			if (typeof c[$pairTarget] === 'object' && c[$pairTarget][$worldToPrefab]) {
				// It's a prefab
				let eid = c[$pairTarget][$worldToPrefab].get(world);
				if (eid == null) {
					// The prefab was not registered yet with this world
					eid = registerPrefab(world, c[$pairTarget]);
				}
				targets.push(eid);
			} else {
				targets.push(c[$pairTarget]);
			}
		}
	}
	return targets;
};
