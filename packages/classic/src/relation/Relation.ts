import { Component, World, getEntityComponents } from '..';
import { defineHiddenProperty } from '../utils/defineHiddenProperty';
import {
	OnTargetRemoved,
	onTargetRemovedSymbol,
	WithComponent,
	withComponentSymbol,
	withOptions,
	WithOptions,
	withOptionsSymbol,
} from './args';
import {
	$pairsMap,
	$isPairComponent,
	$relation,
	$pairTarget,
	$autoRemoveSubject,
	$exclusiveRelation,
	$component,
	$onTargetRemoved,
} from './symbols';
import { RelationOptions, RelationTarget, RelationType } from './types';

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

/**
 * Defines a new relation type with optional configuration options.
 *
 * @param options - An optional object with the following properties:
 *   - `component`: A factory function that creates the relation component.
 *   - `exclusive`: A boolean indicating whether the relation is exclusive (i.e., an entity can only have one instance of this relation).
 *   - `autoRemoveSubject`: A boolean indicating whether the relation component should be automatically removed when the subject entity is removed.
 * @returns A relation type function that can be used to create relation components.
 */
export const defineRelation = <T extends Component>(
	...args: (WithComponent<T> | WithOptions | OnTargetRemoved)[]
): RelationType<T> => {
	const options: RelationOptions = {
		exclusive: false,
		autoRemoveSubject: false,
	};
	let componentFactory = (() => ({})) as () => T;
	let onTargetRemoved = null;

	for (const arg of args) {
		switch (arg.__type) {
			case withComponentSymbol: {
				componentFactory = arg.componentFactory;
				break;
			}
			case withOptionsSymbol: {
				options.exclusive = arg.options.exclusive ?? false;
				options.autoRemoveSubject = arg.options.autoRemoveSubject ?? false;
				break;
			}
			case onTargetRemovedSymbol: {
				onTargetRemoved = arg.onTargetRemoved;
				break;
			}
		}
	}

	const pairsMap = new Map();
	const relation = function (target: RelationTarget) {
		if (target === undefined) throw Error('Relation target is undefined');
		if (target === '*') target = Wildcard;
		return createOrGetRelationComponent<T>(relation, componentFactory, pairsMap, target);
	};
	defineHiddenProperty(relation, $pairsMap, pairsMap);
	defineHiddenProperty(relation, $component, componentFactory);
	defineHiddenProperty(relation, $exclusiveRelation, options.exclusive);
	defineHiddenProperty(relation, $autoRemoveSubject, options.autoRemoveSubject);
	defineHiddenProperty(relation, $onTargetRemoved, onTargetRemoved);

	return relation as RelationType<T>;
};

/**
 * Creates or retrieves a relation component for the given relation and target.
 *
 * @param relation - The relation type to use.
 * @param target - The target for the relation.
 * @returns The relation component for the given relation and target.
 * @throws {Error} If the relation or target is undefined.
 */
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
export const ChildOf = defineRelation(
	withOptions({
		autoRemoveSubject: true,
	})
);

/**
 * Retrieves the relation targets for the given entity in the specified world.
 *
 * @param world - The world to search for the entity.
 * @param relation - The relation type to use.
 * @param eid - The entity ID to search for.
 * @returns An array of relation targets for the given entity and relation.
 */
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
