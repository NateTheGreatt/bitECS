export declare const $u8: unique symbol, $i8: unique symbol, $u16: unique symbol, $i16: unique symbol, $u32: unique symbol, $i32: unique symbol, $f32: unique symbol, $f64: unique symbol, $arr: unique symbol;
export type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
export type TypeSymbol = typeof $u8 | typeof $i8 | typeof $u16 | typeof $i16 | typeof $u32 | typeof $i32 | typeof $f32 | typeof $f64;
export type PrimitiveBrand = (number[] & {
    [key: symbol]: true;
}) | TypedArray;
type ComponentRef = Record<string, PrimitiveBrand | TypedArray | ArrayType<any>>;
type ArrayType<T> = T[] & {
    [$arr]: TypeSymbol | TypeFunction | ArrayType<any>;
};
export declare const u8: (a?: number[]) => PrimitiveBrand, i8: (a?: number[]) => PrimitiveBrand, u16: (a?: number[]) => PrimitiveBrand, i16: (a?: number[]) => PrimitiveBrand, u32: (a?: number[]) => PrimitiveBrand, i32: (a?: number[]) => PrimitiveBrand, f32: (a?: number[]) => PrimitiveBrand, f64: (a?: number[]) => PrimitiveBrand;
type TypeFunction = typeof u8 | typeof i8 | typeof u16 | typeof i16 | typeof u32 | typeof i32 | typeof f32 | typeof f64;
export declare const array: <T extends any[] = any[]>(type?: TypeSymbol | TypeFunction | ArrayType<any>) => ArrayType<T>;
export declare function isArrayType(value: any): value is ArrayType<any>;
export declare function getArrayElementType(arrayType: ArrayType<any>): TypeSymbol | TypeFunction | ArrayType<any>;
export declare const createComponentSerializer: (component: ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>) => (view: DataView, offset: number, index: number) => number;
export declare const createComponentDeserializer: (component: ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>) => (view: DataView, offset: number, entityIdMapping?: Map<number, number>) => number;
export declare const createSoASerializer: (components: (ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>)[], buffer?: ArrayBuffer) => (indices: number[] | readonly number[]) => ArrayBuffer;
export declare const createSoADeserializer: (components: (ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>)[]) => (packet: ArrayBuffer, entityIdMapping?: Map<number, number>) => void;
export {};
//# sourceMappingURL=SoASerializer.d.ts.map