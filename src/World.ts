import { $componentMap } from "./Component.js";
import { $queryMap, $queries, $dirtyQueries, $notQueries } from "./Query.js";
import {
  $entityArray,
  $entityComponents,
  $entityMasks,
  $entitySparseSet,
  getGlobalSize,
  removeEntity,
} from "./Entity.js";
import { resize } from "./Storage.js";
import { SparseSet } from "./Util.js";
import { World } from "./Types.js";

export const $size = Symbol("size");
export const $resizeThreshold = Symbol("resizeThreshold");
export const $bitflag = Symbol("bitflag");
export const $archetypes = Symbol("archetypes");
export const $localEntities = Symbol("localEntities");
export const $localEntityLookup = Symbol("localEntityLookup");

export const worlds: World[] = [];

export const resizeWorlds = (size: number) => {
  worlds.forEach((world) => {
    world[$size] = size;

    for (let i = 0; i < world[$entityMasks].length; i++) {
      const masks = world[$entityMasks][i];
      world[$entityMasks][i] = resize(masks, size);
    }

    world[$resizeThreshold] = world[$size] - world[$size] / 5;
  });
};

/**
 * Creates a new world.
 */
export const createWorld = <T>(
  stateOrSize?: T | number,
  size?: number
): World<T> => {
  const world = (
    typeof stateOrSize === "object" ? stateOrSize : {}
  ) as World<T>;
  size =
    typeof stateOrSize === "number"
      ? stateOrSize
      : typeof size === "number"
      ? size
      : getGlobalSize();
  resetWorld(world, size);
  worlds.push(world);
  return world;
};

/**
 * Resets a world.
 */
export const resetWorld = <T>(
  world: World<T>,
  size = getGlobalSize()
): World<T> => {
  world[$size] = size;

  if (world[$entityArray])
    world[$entityArray].forEach((eid) => removeEntity(world, eid));

  world[$entityMasks] = [new Uint32Array(size)];
  world[$entityComponents] = new Map();
  world[$archetypes] = [];

  world[$entitySparseSet] = SparseSet();
  world[$entityArray] = world[$entitySparseSet].dense;

  world[$bitflag] = 1;

  world[$componentMap] = new Map();

  world[$queryMap] = new Map();
  world[$queries] = new Set();
  world[$notQueries] = new Set();
  world[$dirtyQueries] = new Set();

  world[$localEntities] = new Map();
  world[$localEntityLookup] = new Map();

  return world;
};

/**
 * Deletes a world.
 */
export const deleteWorld = (world: World) => {
  Object.getOwnPropertySymbols(world).forEach(($) => {
    // @ts-ignore
    delete world[$];
  });
  Object.keys(world).forEach((key) => {
    // @ts-ignore
    delete world[key];
  });
  worlds.splice(worlds.indexOf(world), 1);
};

/**
 * Returns all components registered to a world
 */
export const getWorldComponents = (world: World): unknown[] =>
  Array.from(world[$componentMap].keys());

/**
 * Returns all existing entities in a world
 */
export const getAllEntities = (world: World): unknown[] => {
  return world[$entitySparseSet].dense.slice(0);
}
