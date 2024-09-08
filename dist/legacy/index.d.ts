import { ComponentRef, QueryTerm, EntityId } from '../core';
export interface IWorld {
}
export declare const defineQuery: (terms: QueryTerm[]) => {
    (world: IWorld): readonly number[];
    terms: any[];
};
export declare const enterQuery: (queryFn: ReturnType<typeof defineQuery>) => (world: IWorld) => number[];
export declare const exitQuery: (queryFn: ReturnType<typeof defineQuery>) => (world: IWorld) => number[];
export declare const addComponent: (world: IWorld, component: ComponentRef, eid: EntityId) => void;
export declare const hasComponent: (world: IWorld, component: ComponentRef, eid: EntityId) => boolean;
export declare const removeComponent: (world: IWorld, component: ComponentRef, eid: EntityId) => void;
export interface ISchema {
    [key: string]: Type | ListType | ISchema;
}
export type Type = 'i8' | 'ui8' | 'ui8c' | 'i16' | 'ui16' | 'i32' | 'ui32' | 'f32' | 'f64' | 'eid';
export type ListType = readonly [Type, number];
export declare const Types: {
    i8: Type;
    ui8: Type;
    ui8c: Type;
    i16: Type;
    ui16: Type;
    i32: Type;
    ui32: Type;
    f32: Type;
    f64: Type;
    eid: Type;
};
export type TypedArray = Uint8Array | Int8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
export type ArrayByType = {
    'i8': Int8Array;
    'ui8': Uint8Array;
    'ui8c': Uint8ClampedArray;
    'i16': Int16Array;
    'ui16': Uint16Array;
    'i32': Int32Array;
    'ui32': Uint32Array;
    'f32': Float32Array;
    'f64': Float64Array;
    'eid': Uint32Array;
};
export type ComponentType<T extends ISchema> = {
    [key in keyof T]: T[key] extends Type ? ArrayByType[T[key]] : T[key] extends [infer RT, number] ? RT extends Type ? Array<ArrayByType[RT]> : unknown : T[key] extends ISchema ? ComponentType<T[key]> : unknown;
};
export declare const defineComponent: <T extends ISchema>(schema: T, max?: number) => ComponentType<T>;
//# sourceMappingURL=index.d.ts.map