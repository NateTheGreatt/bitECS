import { Component, World, getEntityComponents } from '..';
import { defineHiddenProperty } from '../utils/defineHiddenProperty';
import {
	$pairsMap,
	$isPairComponent,
	$relation,
	$pairTarget,
	$autoRemoveSubject,
	$exclusiveRelation,
	$component,
} from './symbols';
import { RelationTarget, RelationType } from './types';

function createOrGetRelationComponent<T extends Component>(
	relation: (target: RelationTarget) => T,
	componentFactory: () => T,
	pairsMap: Map<any, T>,
	target: RelationTarget
) {
	if (!pairsMap.has(target)) {
		const component = componentFactory();
		defineHiddenProperty(component, $isPairComponent, true);
		defineHiddenProperty(component, $relation, relation);
		defineHiddenProperty(component, $pairTarget, target);
		pairsMap.set(target, component);
	}

	return pairsMap.get(target)!;
}

export const defineRelation = <T extends Component>(options?: {
	component?: () => T;
	exclusive?: boolean;
	autoRemoveSubject?: boolean;
}): RelationType<T> => {
	const componentFactory = options?.component || ((() => ({})) as () => T);

	const pairsMap = new Map();
	const relation = function (target: RelationTarget) {
		if (target === undefined) throw Error('Relation target is undefined');
		if (target === '*') target = Wildcard;
		return createOrGetRelationComponent<T>(relation, componentFactory, pairsMap, target);
	};
	defineHiddenProperty(relation, $pairsMap, pairsMap);
	defineHiddenProperty(relation, $component, componentFactory);
	defineHiddenProperty(relation, $exclusiveRelation, options && options.exclusive);
	defineHiddenProperty(relation, $autoRemoveSubject, options && options.autoRemoveSubject);
	return relation as RelationType<T>;
};

export const Pair = <T extends Component>(relation: RelationType<T>, target: RelationTarget): T => {
	if (relation === undefined) throw Error('Relation is undefined');
	if (target === undefined) throw Error('Relation target is undefined');
	if (target === '*') target = Wildcard;

	const pairsMap = relation[$pairsMap];
	const componentFactory = relation[$component];

	return createOrGetRelationComponent<T>(relation, componentFactory, pairsMap, target);
};

export const Wildcard: RelationType<any> | string = defineRelation();
export const IsA: RelationType<any> = defineRelation();
export const ChildOf = defineRelation({
	autoRemoveSubject: true,
});

export const getRelationTargets = (world: World, relation: RelationType<any>, eid: number) => {
	const components = getEntityComponents(world, eid);
	const targets = [];
	for (const c of components) {
		if (c[$relation] === relation && c[$pairTarget] !== Wildcard) {
			targets.push(c[$pairTarget]);
		}
	}
	return targets;
};
