import { IWorld, Component, IComponentProp } from '../core';
export type Serializer<W extends IWorld = IWorld> = (target: W | number[]) => ArrayBuffer;
export type Deserializer<W extends IWorld = IWorld> = (world: W, packet: ArrayBuffer, mode?: 'full' | 'partial') => number[];
export declare function defineSerializer<W extends IWorld = IWorld>(components: Component[] | IComponentProp[], maxBytes?: number): Serializer<W>;
export declare function defineDeserializer<W extends IWorld = IWorld>(components: Component[] | IComponentProp[]): Deserializer<W>;
export declare enum DESERIALIZE_MODE {
    REPLACE = 0,
    APPEND = 1,
    MAP = 2
}
//# sourceMappingURL=serialization.d.ts.map