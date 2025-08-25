import { TypedArray, PrimitiveBrand, ArrayType } from './SoASerializer';
export type AoSComponentRef = PrimitiveBrand | TypedArray | ArrayType<any> | Record<string, PrimitiveBrand | TypedArray | ArrayType<any>>;
export type AoSSerializerOptions = {
    diff?: boolean;
    buffer?: ArrayBuffer;
    epsilon?: number;
};
export declare const createAoSSerializer: (components: AoSComponentRef[], options?: AoSSerializerOptions) => (entityIds: number[] | readonly number[]) => ArrayBuffer;
export type AoSDeserializerOptions = {
    diff?: boolean;
};
export declare const createAoSDeserializer: (components: AoSComponentRef[], options?: AoSDeserializerOptions) => (packet: ArrayBuffer, entityIdMapping?: Map<number, number>) => void;
//# sourceMappingURL=AoSSerializer.d.ts.map