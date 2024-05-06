import { DESERIALIZE_MODE } from "..";
import { World } from "../world/types";

export type Serializer<W extends World = World> = (
  target: W | number[]
) => ArrayBuffer;
export type Deserializer<W extends World = World> = (
  world: W,
  packet: ArrayBuffer,
  mode?: (typeof DESERIALIZE_MODE)[keyof typeof DESERIALIZE_MODE]
) => number[];
