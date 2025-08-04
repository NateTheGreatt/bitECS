import { World, ComponentRef } from 'bitecs';
export declare const createObserverSerializer: (world: World, networkedTag: ComponentRef, components: ComponentRef[], buffer?: ArrayBuffer) => () => ArrayBuffer;
export declare const createObserverDeserializer: (world: World, networkedTag: ComponentRef, components: ComponentRef[], constructorMapping?: Map<number, number>) => (packet: ArrayBuffer, overrideMapping?: Map<number, number>) => Map<number, number>;
//# sourceMappingURL=ObserverSerializer.d.ts.map