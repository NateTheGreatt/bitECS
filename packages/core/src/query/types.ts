import { Component, ComponentNode } from "../component/types";
import { World } from "../world/types";

export type QueryModifier<W extends World = World> = (
  c: Component[]
) => (world: W) => Component | QueryModifier<W>;

export type Query<W extends World = World> = (
  world: W,
  clearDiff?: boolean
) => number[];

export interface QueryNode {
  [key: string | symbol | number]: any;
  allComponents: Component[];
}
