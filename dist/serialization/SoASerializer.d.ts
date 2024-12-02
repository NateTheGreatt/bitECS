export declare const $u8: unique symbol, $i8: unique symbol, $u16: unique symbol, $i16: unique symbol, $u32: unique symbol, $i32: unique symbol, $f32: unique symbol, $f64: unique symbol;
export type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
export type TypeSymbol = typeof $u8 | typeof $i8 | typeof $u16 | typeof $i16 | typeof $u32 | typeof $i32 | typeof $f32 | typeof $f64;
export type PrimitiveBrand = (number[] & {
    [key: symbol]: true;
}) | TypedArray;
type ComponentRef = Record<string, PrimitiveBrand | TypedArray>;
export declare const u8: (a?: number[]) => PrimitiveBrand, i8: (a?: number[]) => PrimitiveBrand, u16: (a?: number[]) => PrimitiveBrand, i16: (a?: number[]) => PrimitiveBrand, u32: (a?: number[]) => PrimitiveBrand, i32: (a?: number[]) => PrimitiveBrand, f32: (a?: number[]) => PrimitiveBrand, f64: (a?: number[]) => PrimitiveBrand;
export declare const createComponentSerializer: (component: ComponentRef) => (view: DataView, offset: number, index: number) => number;
export declare const createComponentDeserializer: (component: ComponentRef) => (view: DataView, offset: number, entityIdMapping?: Map<number, number>) => number;
export declare const createSoASerializer: (components: ComponentRef[], buffer?: ArrayBuffer) => (indices: number[] | readonly number[]) => ArrayBuffer;
export declare const createSoADeserializer: (components: ComponentRef[]) => (packet: ArrayBuffer, entityIdMapping?: Map<number, number>) => void;
export {};
//# sourceMappingURL=SoASerializer.d.ts.map