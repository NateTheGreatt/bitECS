import { Schema } from "..";
import { ComponentType, defineComponent } from "..";
import { $schema } from "../component/symbols";

const $pairsMap = Symbol('pairsMap')
export const $isPairComponent = Symbol('isPairComponent')
export const $relation = Symbol('relation')

export const Wildcard = '*'

export type RelationType<T extends Schema> = T & {
    [$pairsMap]: Map<number | string, ComponentType<T>>
    [$schema]: Schema
} & ((target: string | number) => ComponentType<T>)

export const defineRelation = 
    <T extends Schema>(schema: T = {} as T): RelationType<T> => {
        const pairsMap = new Map();
        const relation = function (target: number | string) {
            if (!pairsMap.has(target)) {
                const component = defineComponent(schema) as any
                component[$isPairComponent] = true;
                component[$relation] = relation;
                pairsMap.set(target, component);
            }
            return pairsMap.get(target) as ComponentType<T>;
        }
        Object.defineProperty(relation, $pairsMap, { enumerable: false, writable: true, value: pairsMap })
        Object.defineProperty(relation, $schema, { enumerable: false, writable: true, value: schema })
        return relation as RelationType<T>
    }

export const Pair = <T extends Schema>(relation: RelationType<T>, target: number | string): ComponentType<T> => {
    const map = (relation as RelationType<T>)[$pairsMap]

    if (!map.has(target)) {
        const component = defineComponent(relation[$schema]) as any
        component[$isPairComponent] = true;
        component[$relation] = relation;
        map.set(target, component);
    }

    return map.get(target) as ComponentType<T>;
};