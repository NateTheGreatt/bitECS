import { IWorld, Component, IComponentProp } from './index';
export type Serializer<W extends IWorld = IWorld> = (world: W, ents: number[]) => ArrayBuffer;
export type Deserializer<W extends IWorld = IWorld> = (world: W, packet: ArrayBuffer, mode?: DESERIALIZE_MODE) => number[];
export declare function defineSerializer<W extends IWorld = IWorld>(components: Component[] | IComponentProp[], maxBytes?: number): Serializer<W>;
export declare function defineDeserializer<W extends IWorld = IWorld>(components: Component[] | IComponentProp[]): Deserializer<W>;
export declare enum DESERIALIZE_MODE {
    REPLACE = 0,
    APPEND = 1,
    MAP = 2
}
//# sourceMappingURL=serialization.d.ts.map