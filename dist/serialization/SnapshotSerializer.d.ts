import { PrimitiveBrand } from './SoASerializer';
import { World, ComponentRef } from 'bitecs';
export declare const createSnapshotSerializer: (world: World, components: (Record<string, PrimitiveBrand> | ComponentRef)[], buffer?: ArrayBuffer) => () => ArrayBuffer;
export declare const createSnapshotDeserializer: (world: World, components: (Record<string, PrimitiveBrand> | ComponentRef)[]) => (packet: ArrayBuffer) => Map<number, number>;
//# sourceMappingURL=SnapshotSerializer.d.ts.map