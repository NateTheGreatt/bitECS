import {
  $storeSize,
  createStore,
  resetStoreFor,
  resizeStore,
} from "./Storage.js";
import {
  $queries,
  queryAddEntity,
  queryRemoveEntity,
  queryCheckEntity,
  commitRemovals,
} from "./Query.js";
import { $bitflag, $size } from "./World.js";
import {
  $entityMasks,
  getDefaultSize,
  eidToWorld,
  $entityComponents,
  getGlobalSize,
  $entitySparseSet,
} from "./Entity.js";
import { ComponentSchema, Component, World } from "./Types.js";

export const $componentMap = Symbol("componentMap");

export const components: Component[] = [];

export const resizeComponents = (size: number) => {
  components.forEach((component) => resizeStore(component, size));
};

/**
 * Defines a new component store.
 */
export const defineComponent = <TSchema extends ComponentSchema>(
  schema: TSchema,
  size: number
) => {
  const component = createStore(schema, size || getGlobalSize());
  if (schema && component && Object.keys(schema).length)
    components.push(component);
  return component;
};

export const incrementBitflag = (world: World) => {
  world[$bitflag] *= 2;
  if (world[$bitflag] >= 2 ** 31) {
    world[$bitflag] = 1;
    world[$entityMasks].push(new Uint32Array(world[$size]));
  }
};

/**
 * Registers a component with a world.
 */
export const registerComponent = (world: World, component: Component) => {
  if (!component)
    throw new Error(`bitECS - Cannot register null or undefined component`);

  const queries = new Set();
  const notQueries = new Set();
  const changedQueries = new Set();

  world[$queries].forEach((q) => {
    if (q.allComponents.includes(component)) {
      queries.add(q);
    }
  });

  world[$componentMap].set(component, {
    generationId: world[$entityMasks].length - 1,
    bitflag: world[$bitflag],
    store: component,
    queries,
    notQueries,
    changedQueries,
  });

  if (component[$storeSize] < getGlobalSize()) {
    resizeStore(component, getGlobalSize());
  }

  incrementBitflag(world);
};

/**
 * Registers multiple components with a world.
 */
export const registerComponents = (world: World, components: Component[]) => {
  components.forEach((c) => registerComponent(world, c));
};

/**
 * Checks if an entity has a component.
 */
export const hasComponent = (
  world: World,
  component: Component,
  eid: number
) => {
  const registeredComponent = world[$componentMap].get(component);
  if (!registeredComponent) return false;
  const { generationId, bitflag } = registeredComponent;
  const mask = world[$entityMasks][generationId][eid];
  return (mask & bitflag) === bitflag;
};

/**
 * Adds a component to an entity
 */
export const addComponent = (
  world: World,
  component: Component,
  eid: number,
  reset = false
) => {
  if (eid === undefined) throw new Error("bitECS - entity is undefined.");
  if (!world[$entitySparseSet].has(eid))
    throw new Error("bitECS - entity does not exist in the world.");
  if (!world[$componentMap].has(component)) registerComponent(world, component);
  if (hasComponent(world, component, eid)) return;

  const c = world[$componentMap].get(component);
  if (!c) throw new Error("bitECS - unknown component");

  const { generationId, bitflag, queries, notQueries } = c;

  // Add bitflag to entity bitmask
  world[$entityMasks][generationId][eid] |= bitflag;

  // todo: archetype graph
  queries.forEach((q) => {
    // remove this entity from toRemove if it exists in this query
    q.toRemove.remove(eid);
    const match = queryCheckEntity(world, q, eid);
    if (match) {
      q.exited.remove(eid);
      queryAddEntity(q, eid);
    }
    if (!match) {
      q.entered.remove(eid);
      queryRemoveEntity(world, q, eid);
    }
  });

  world[$entityComponents].get(eid)!.add(component);

  // Zero out each property value
  if (reset) resetStoreFor(component, eid);
};

/**
 * Removes a component from an entity and resets component state unless otherwise specified.
 */
export const removeComponent = (
  world: World,
  component: Component,
  eid: number,
  reset = true
) => {
  if (eid === undefined) throw new Error("bitECS - entity is undefined.");
  if (!world[$entitySparseSet].has(eid))
    throw new Error("bitECS - entity does not exist in the world.");
  if (!hasComponent(world, component, eid)) return;

  const c = world[$componentMap].get(component);
  if (!c) throw new Error("bitECS - unknown component");

  const { generationId, bitflag, queries } = c;

  // Remove flag from entity bitmask
  world[$entityMasks][generationId][eid] &= ~bitflag;

  // todo: archetype graph
  queries.forEach((q) => {
    // remove this entity from toRemove if it exists in this query
    q.toRemove.remove(eid);
    const match = queryCheckEntity(world, q, eid);
    if (match) {
      q.exited.remove(eid);
      queryAddEntity(q, eid);
    }
    if (!match) {
      q.entered.remove(eid);
      queryRemoveEntity(world, q, eid);
    }
  });

  world[$entityComponents].get(eid)!.delete(component);

  // Zero out each property value
  if (reset) resetStoreFor(component, eid);
};
