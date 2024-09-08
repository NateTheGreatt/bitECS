import { IWorld, Component, IComponentProp } from '../core';
export type Serializer<W extends IWorld = IWorld> = (target: W | number[]) => ArrayBuffer;
export type Deserializer<W extends IWorld = IWorld> = (world: W, packet: ArrayBuffer, mode?: 'full' | 'partial') => number[];
export declare function defineSerializer<W extends IWorld = IWorld>(components: Component[] | IComponentProp[], maxBytes?: number): Serializer<W>;
export declare function defineDeserializer<W extends IWorld = IWorld>(components: Component[] | IComponentProp[]): Deserializer<W>;
//# sourceMappingURL=serialization.d.ts.map