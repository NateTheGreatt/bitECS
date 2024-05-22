import { Schema, World, entityExists, getEntityComponents, registerPrefab, removeEntity } from '..';
import { ComponentType, defineComponent } from '..';
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
import { RelationOptions, RelationTarget, RelationType } from './types';

function createOrGetRelationComponent<T extends Schema>(
	relation: (target: RelationTarget) => ComponentType<T>,
	schema: T,
	pairsMap: Map<any, any>,
	target: RelationTarget
) {
	if (!pairsMap.has(target)) {
		const component = defineComponent(schema) as any;
		defineHiddenProperty(component, $isPairComponent, true);
		defineHiddenProperty(component, $relation, relation);
		defineHiddenProperty(component, $pairTarget, target);
		pairsMap.set(target, component);
	}
	return pairsMap.get(target) as ComponentType<T>;
}

export const defineRelation = <T extends Schema>(
	schema: T = {} as T,
	options?: RelationOptions
): RelationType<T> => {
	const pairsMap = new Map();
	const relation = function (target: RelationTarget) {
		if (target === undefined) throw Error('Relation target is undefined');
		if (target === '*') target = Wildcard;
		return createOrGetRelationComponent<T>(relation, schema, pairsMap, target);
	};
	defineHiddenProperty(relation, $pairsMap, pairsMap);
	defineHiddenProperty(relation, $schema, schema);
	defineHiddenProperty(relation, $exclusiveRelation, options && options.exclusive);
	defineHiddenProperty(relation, $autoRemoveSubject, options && options.autoRemoveSubject);
	defineHiddenProperty(relation, $onTargetRemoved, options ? options.onTargetRemoved : undefined);
	return relation as RelationType<T>;
};

export const Pair = <T extends Schema>(
	relation: RelationType<T>,
	target: RelationTarget
): ComponentType<T> => {
	if (relation === undefined) throw Error('Relation is undefined');
	if (target === undefined) throw Error('Relation target is undefined');
	if (target === '*') target = Wildcard;

	const pairsMap = (relation as RelationType<T>)[$pairsMap];
	const schema = (relation as RelationType<T>)[$schema] as T;

	return createOrGetRelationComponent<T>(relation, schema, pairsMap, target);
};

export const Wildcard: RelationType<any> | string = defineRelation();
export const IsA: RelationType<any> = defineRelation();

export const getRelationTargets = (world: World, relation: RelationType<any>, eid: number) => {
	const components = getEntityComponents(world, eid);
	const targets = [];
	for (const c of components) {
		if (c[$relation] === relation && c[$pairTarget] !== Wildcard) {
			if (c[$pairTarget] instanceof Object) {
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
