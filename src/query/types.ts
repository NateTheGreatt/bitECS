import { Component, ComponentProp } from "../component/types";
import { World } from "../world/types";

export type QueryModifier<W extends World = World> = (
  c: (Component | ComponentProp)[]
) => (world: W) => Component | QueryModifier<W>;

export type Query<W extends World = World> = (
  world: W,
  clearDiff?: boolean
) => number[];
