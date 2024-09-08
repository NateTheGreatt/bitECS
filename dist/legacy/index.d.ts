import { ComponentRef, QueryTerm, World, EntityId } from '../core';
export declare const defineQuery: (terms: QueryTerm[]) => {
    (world: World): readonly number[];
    terms: any[];
};
export declare const enterQuery: (queryFn: ReturnType<typeof defineQuery>) => (world: World) => number[];
export declare const exitQuery: (queryFn: ReturnType<typeof defineQuery>) => (world: World) => number[];
export declare const addComponent: (world: World, component: ComponentRef, eid: EntityId) => void;
export declare const hasComponent: (world: World, component: ComponentRef, eid: EntityId) => boolean;
export declare const removeComponent: (world: World, component: ComponentRef, eid: EntityId) => void;
export type Schema = {
    [key: string]: Schema | PrimitiveType | [PrimitiveType, number];
};
export type PrimitiveType = 'f32' | 'i32' | 'u32' | 'f64' | 'i8' | 'u8' | 'i16' | 'u16';
export declare const Types: {
    f32: PrimitiveType;
    i32: PrimitiveType;
    u32: PrimitiveType;
    f64: PrimitiveType;
    i8: PrimitiveType;
    u8: PrimitiveType;
    i16: PrimitiveType;
    u16: PrimitiveType;
};
type ArrayByType = {
    'f32': Float32Array;
    'i32': Int32Array;
    'u32': Uint32Array;
    'f64': Float64Array;
    'i8': Int8Array;
    'u8': Uint8Array;
    'i16': Int16Array;
    'u16': Uint16Array;
};
export type ComponentType<T extends Schema> = {
    [key in keyof T]: T[key] extends PrimitiveType ? ArrayByType[T[key]] : T[key] extends [infer RT, number] ? RT extends PrimitiveType ? ArrayByType[RT][] : unknown : T[key] extends Schema ? ComponentType<T[key]> : unknown;
};
export declare const defineComponent: <T extends Schema>(schema: T, max?: number) => ComponentType<T>;
export {};
//# sourceMappingURL=index.d.ts.map