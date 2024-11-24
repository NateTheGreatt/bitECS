import { PrimitiveBrand } from './SoASerializer';
import { World } from 'bitecs';
export declare const createSnapshotSerializer: (world: World, components: Record<string, PrimitiveBrand>[], buffer?: ArrayBuffer) => () => ArrayBuffer;
export declare const createSnapshotDeserializer: (world: World, components: Record<string, PrimitiveBrand>[]) => (packet: ArrayBuffer) => Map<number, number>;
//# sourceMappingURL=SnapshotSerializer.d.ts.map