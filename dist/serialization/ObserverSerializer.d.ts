import { World } from '../core';
export declare const createObserverSerializer: (world: World, networkedTag: any, components: any[], buffer?: ArrayBuffer) => () => ArrayBuffer;
export declare const createObserverDeserializer: (world: World, networkedTag: any, components: any[]) => (packet: ArrayBuffer, entityIdMapping?: Map<number, number>) => Map<number, number>;
//# sourceMappingURL=ObserverSerializer.d.ts.map