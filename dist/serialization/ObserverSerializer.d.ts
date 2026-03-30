import { World, ComponentRef } from 'bitecs';
export type ObserverSerializerOptions = {
    buffer?: ArrayBuffer;
};
export declare const createObserverSerializer: (world: World, networkedTag: ComponentRef, components: ComponentRef[], options?: ObserverSerializerOptions) => ObserverSerializerFunction;
export type ObserverSerializerFunction = {
    (): ArrayBuffer;
    getRemovals: () => Set<number>;
};
export type ObserverDeserializerOptions = {
    idMap?: Map<number, number>;
};
export declare const createObserverDeserializer: (world: World, networkedTag: ComponentRef, components: ComponentRef[], options?: ObserverDeserializerOptions) => (packet: ArrayBuffer, idMap?: Map<number, number>) => Map<number, number>;
//# sourceMappingURL=ObserverSerializer.d.ts.map