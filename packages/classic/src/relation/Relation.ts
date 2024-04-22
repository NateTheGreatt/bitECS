import { Schema, World, getEntityComponents, removeEntity } from "..";
import { ComponentType, defineComponent } from "..";
import { $schema } from "../component/symbols";
import { defineHiddenProperty } from "../utils/defineHiddenProperty";
import { $pairsMap, $isPairComponent, $relation, $pairTarget, $onTargetRemoved, $autoRemoveSubject } from "./symbols";
import { RelationOptions, RelationType } from "./types";

export const defineRelation = 
    <T extends Schema>(schema: T = {} as T, options?: RelationOptions): RelationType<T> => {
        const pairsMap = new Map();
        const relation = function (target: number | string) {
            if (!pairsMap.has(target)) {
                const component = defineComponent(schema) as any
                defineHiddenProperty(component, $isPairComponent, true)
                defineHiddenProperty(component, $relation, relation)
                defineHiddenProperty(component, $pairTarget, target)
                pairsMap.set(target, component);
            }
            return pairsMap.get(target) as ComponentType<T>;
        }
        defineHiddenProperty(relation, $pairsMap, pairsMap)
        defineHiddenProperty(relation, $schema, schema)
        defineHiddenProperty(relation, $onTargetRemoved, options ? options.onTargetRemoved : undefined)
        defineHiddenProperty(relation, $autoRemoveSubject, options && options.autoRemoveSubject)
        return relation as RelationType<T>
    }

export const Pair = <T extends Schema>(relation: RelationType<T>, target: number | string): ComponentType<T> => {
    const pairsMap = (relation as RelationType<T>)[$pairsMap]

    if (!pairsMap.has(target)) {
        const component = defineComponent(relation[$schema]) as any
        defineHiddenProperty(component, $isPairComponent, true)
        defineHiddenProperty(component, $relation, relation)
        defineHiddenProperty(component, $pairTarget, target)
        pairsMap.set(target, component);
    }
    return pairsMap.get(target) as ComponentType<T>;
};

export const Wildcard: RelationType<any> | string = defineRelation()

export const getRelationTargets = (world: World, relation:RelationType<any>, eid: number) => {
    const components = getEntityComponents(world, eid);
    const targets = []
    for (const c of components) {
        if (c[$relation] === relation) targets.push(c[$pairTarget])
    }
    return targets
}