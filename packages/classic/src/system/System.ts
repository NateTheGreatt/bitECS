import { World } from "../world/types";

/**
 * Defines a new system function.
 *
 * @param {function} update
 * @returns {function}
 */
export const defineSystem =
  <W extends World = World, R extends any[] = any[]>(
    update: (world: W, ...args: R) => void
  ): System<W, R> =>
  (world: W, ...args: R) => {
    update(world, ...args);
    return world;
  };

export type System<W extends World = World, R extends any[] = any[]> = (
  world: W,
  ...args: R
) => W;
