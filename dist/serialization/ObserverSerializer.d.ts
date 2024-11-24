import { World, ComponentRef } from 'bitecs';
export declare const createObserverSerializer: (world: World, networkedTag: ComponentRef, components: ComponentRef[], buffer?: ArrayBuffer) => () => ArrayBuffer;
export declare const createObserverDeserializer: (world: World, networkedTag: ComponentRef, components: ComponentRef[], entityIdMapping?: Map<number, number>) => (packet: ArrayBuffer) => Map<number, number>;
//# sourceMappingURL=ObserverSerializer.d.ts.map