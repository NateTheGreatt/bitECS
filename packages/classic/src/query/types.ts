import { Component } from '../component/types';
import { World } from '../world/types';

export type QueryModifier<W extends World = World> = (
	c: Component[]
) => (world: W) => Component | QueryModifier<W>;

export type Query<W extends World = World> = (world: W, clearDiff?: boolean) => Uint32Array;

export type QueryNode = Record<string | symbol, any> & {
	allComponents: Component[];
};
