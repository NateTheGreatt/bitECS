import { Schema } from "..";
import { ComponentType, defineComponent } from "..";

const $pairsMap = Symbol('pairsMap')
export const $isPairComponent = Symbol('isPairComponent')
export const $relation = Symbol('relation')

export const Wildcard = '*'

export type RelationType<T extends Schema> = T & {
    [$pairsMap]: Map<number | string, ComponentType<T>>
}

export const defineRelation = 
    <T extends Schema>(schema: T = {} as T): RelationType<T> => {
        const relation = schema as RelationType<T>
        Object.defineProperty(relation, $pairsMap, { enumerable: false, writable: true, value: new Map() })
        return relation
    }

export const Pair = <T extends Schema>(relation: T, target: number | string): ComponentType<T> => {
    const map = (relation as RelationType<T>)[$pairsMap]

    if (!map.has(target)) {
        const component = defineComponent(relation) as any
        component[$isPairComponent] = true;
        component[$relation] = relation;
        map.set(target, component);
    }

    return map.get(target) as ComponentType<T>;
};