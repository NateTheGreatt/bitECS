export type Component = Record<any, any>;
export type DataViewWithCursor = DataView & {
    cursor: number;
    shadowMap: Map<TypedArray, any>;
};
export type TypedArray = Uint8Array | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
export type IdMap = Map<number, number>;
export type ComponentWriter = (v: DataViewWithCursor, entity: number) => 0 | 1;
export type EntityWriter = (v: DataViewWithCursor, entity: number) => 0 | 1;
export type DataWriter = (packet: ArrayBuffer, entities: number[], idMap?: IdMap) => void;
export type ComponentReader = (v: DataViewWithCursor, entity: number) => void;
export type EntityReader = (v: DataViewWithCursor, idMap: IdMap) => void;
export type DataReader = (packet: ArrayBuffer, idMap: IdMap) => void;
