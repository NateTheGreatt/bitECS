import { World, ComponentRef } from '../core';
export declare const createObserverSerializer: (world: World, networkedTag: ComponentRef, components: ComponentRef[], buffer?: ArrayBuffer) => () => ArrayBuffer;
export declare const createObserverDeserializer: (world: World, networkedTag: ComponentRef, components: ComponentRef[]) => (packet: ArrayBuffer, entityIdMapping?: Map<number, number>) => Map<number, number>;
//# sourceMappingURL=ObserverSerializer.d.ts.map