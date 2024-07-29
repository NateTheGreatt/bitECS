import { World } from '../world/types';

export type System<W extends World = World, R extends any[] = any[]> = (world: W, ...args: R) => W;
