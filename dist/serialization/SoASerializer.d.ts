export declare const $u8: unique symbol, $i8: unique symbol, $u16: unique symbol, $i16: unique symbol, $u32: unique symbol, $i32: unique symbol, $f32: unique symbol, $f64: unique symbol, $ref: unique symbol, $str: unique symbol, $arr: unique symbol;
export type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
export type TypeSymbol = typeof $u8 | typeof $i8 | typeof $u16 | typeof $i16 | typeof $u32 | typeof $i32 | typeof $f32 | typeof $f64 | typeof $str | typeof $ref;
export type PrimitiveBrand = ((number[] | string[]) & {
    [key: symbol]: true;
}) | TypedArray;
export type ComponentRef = Record<string, any>;
export type ArrayType<T> = T[] & {
    [$arr]: TypeSymbol | TypeFunction | ArrayType<any>;
};
export declare const u8: (a?: number[]) => number[], i8: (a?: number[]) => number[], u16: (a?: number[]) => number[], i16: (a?: number[]) => number[], u32: (a?: number[]) => number[], i32: (a?: number[]) => number[], f32: (a?: number[]) => number[], f64: (a?: number[]) => number[], ref: (a?: number[]) => number[], str: (a?: string[]) => string[];
type TypeFunction = typeof u8 | typeof i8 | typeof u16 | typeof i16 | typeof u32 | typeof i32 | typeof f32 | typeof f64 | typeof str | typeof ref;
export declare const typeSetters: Record<TypeSymbol, (view: DataView, offset: number, value: any) => number>;
export declare const typeGetters: Record<TypeSymbol, (view: DataView, offset: number) => {
    value: any;
    size: number;
}>;
export declare function array(type: typeof $str | typeof str): ArrayType<string[]>;
export declare function array(type?: TypeSymbol | TypeFunction): ArrayType<number[]>;
export declare function array<T>(type: ArrayType<T>): ArrayType<T[]>;
export declare function getTypeForArray(arr: PrimitiveBrand | TypedArray | ArrayType<any>): TypeSymbol;
export declare function isArrayType(value: any): value is ArrayType<any>;
export declare function getArrayElementType(arrayType: ArrayType<any>): TypeSymbol | TypeFunction | ArrayType<any>;
export declare function serializeArrayValue(elementType: ArrayType<any> | TypeSymbol | TypeFunction, value: any[], view: DataView, offset: number): number;
export declare function deserializeArrayValue(elementType: ArrayType<any> | TypeSymbol | TypeFunction, view: DataView, offset: number, entityIdMapping?: Map<number, number>): {
    size: number;
    value?: undefined;
} | {
    value: any;
    size: number;
};
export declare const createComponentSerializer: (component: ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>, diff?: boolean, shadowMap?: Map<any, any>, epsilon?: number) => (view: DataView, offset: number, index: number, componentId: number) => number;
export declare const createComponentDeserializer: (component: ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>, diff?: boolean) => (view: DataView, offset: number, entityIdMapping?: Map<number, number>) => number;
export type SoASerializerOptions = {
    diff?: boolean;
    buffer?: ArrayBuffer;
    epsilon?: number;
    getRemovals?: () => Set<number>;
};
export declare const createSoASerializer: (components: (ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>)[], options?: SoASerializerOptions) => SoASerializerFunction;
export type SoASerializerFunction = {
    (indices: number[] | readonly number[]): ArrayBuffer;
    clearEntity?: (eid: number) => void;
};
export type SoADeserializerOptions = {
    diff?: boolean;
};
export declare const createSoADeserializer: (components: (ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>)[], options?: SoADeserializerOptions) => (packet: ArrayBuffer, entityIdMapping?: Map<number, number>) => void;
export {};
//# sourceMappingURL=SoASerializer.d.ts.map