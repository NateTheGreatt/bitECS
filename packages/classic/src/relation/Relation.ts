import { Schema } from "..";
import { ComponentType, defineComponent } from "..";

const $pairsMap = Symbol('pairsMap')

export type RelationType<T extends Schema> = T & {
    [$pairsMap]: Map<number, ComponentType<T>>
}

export const defineRelation = 
    <T extends Schema>(schema: T = {} as T): RelationType<T> => {
        const relation = schema as RelationType<T>
        relation[$pairsMap] = new Map<number, ComponentType<T>>()
        return relation
    }

export const Pair = <T extends Schema>(relation: T, target: number): ComponentType<T> => {
    const map = (relation as RelationType<T>)[$pairsMap]

    if (!map.has(target)) {
        map.set(target, defineComponent(relation));
    }

    return map.get(target) as ComponentType<T>;
};