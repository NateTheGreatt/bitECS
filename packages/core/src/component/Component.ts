import {
  queryAddEntity,
  queryRemoveEntity,
  queryCheckEntity,
} from "../query/Query.js";
import { $bitflag } from "../world/symbols.js";
import {
  $entitySparseSet,
  $entityMasks,
  $entityComponents,
} from "../entity/symbols.js";
import { Component, ComponentNode } from "./types.js";
import { World } from "../world/types.js";
import { $componentMap } from "./symbols.js";
import { TODO } from "../utils/types.js";
import { $queries } from "../query/symbols.js";
import { entityExists, incrementWorldBitflag } from "../world/World.js";
import { QueryNode } from "../query/types.js";

export const components: Component[] = [];

/**
 * Registers a component with a world.
 *
 * @param {World} world
 * @param {Component} component
 */
export const registerComponent = (world: World, component: Component) => {
  if (!component)
    throw new Error(`bitECS - Cannot register null or undefined component`);

  const queries = new Set<QueryNode>();

  // Collect all queries that match this component.
  world[$queries].forEach((queryNode) => {
    if (queryNode.allComponents.includes(component)) {
      queries.add(queryNode);
    }
  });

  // Register internal component node with world.
  const componentNode: ComponentNode = {
    generationId: world[$entityMasks].length - 1,
    bitflag: world[$bitflag],
    ref: component,
    queries,
  };

  world[$componentMap].set(component, componentNode);

  incrementWorldBitflag(world);
};

/**
 * Registers multiple components with a world.
 *
 * @param {World} world
 * @param {Component[]} components
 */
export const registerComponents = (world: World, components: Component[]) => {
  components.forEach((componetn) => registerComponent(world, componetn));
};

/**
 * Checks if an entity has a component.
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 * @returns {boolean}
 */
export const hasComponent = (
  world: World,
  component: Component,
  eid: number
): boolean => {
  const registeredComponent = world[$componentMap].get(component);
  if (!registeredComponent) return false;

  const { generationId, bitflag } = registeredComponent;
  const mask = world[$entityMasks][generationId][eid];

  return (mask & bitflag) === bitflag;
};

/**
 * Adds a component to an entity
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 */
export const addComponent = (
  world: World,
  component: Component,
  eid: number
) => {
  if (!entityExists(world, eid)) {
    throw new Error("bitECS - entity does not exist in the world.");
  }

  // Register the component with the world if it isn't already.
  if (!world[$componentMap].has(component)) registerComponent(world, component);

  // Exit early if the entity already has the component.
  if (hasComponent(world, component, eid)) return;

  const componentNode = world[$componentMap].get(component)!;
  const { generationId, bitflag, queries } = componentNode;

  // Add bitflag to entity bitmask.
  world[$entityMasks][generationId][eid] |= bitflag;

  // Add entity to matching queries.
  queries.forEach((queryNode: QueryNode) => {
    // Remove this entity from toRemove if it exists in this query.
    queryNode.toRemove.remove(eid);
    const match = queryCheckEntity(world, queryNode, eid);

    if (match) {
      queryNode.exited.remove(eid);
      queryAddEntity(queryNode, eid);
    }

    if (!match) {
      queryNode.entered.remove(eid);
      queryRemoveEntity(world, queryNode, eid);
    }
  });

  // Add component to entity internally.
  world[$entityComponents].get(eid)!.add(component);
};

/**
 * Removes a component from an entity.
 *
 * @param {World} world
 * @param {Component} component
 * @param {number} eid
 */
export const removeComponent = (
  world: World,
  component: Component,
  eid: number
) => {
  if (!entityExists(world, eid)) {
    throw new Error("bitECS - entity does not exist in the world.");
  }

  // Exit early if the entity does not have the component.
  if (!hasComponent(world, component, eid)) return;

  const componentNode = world[$componentMap].get(component)!;
  const { generationId, bitflag, queries } = componentNode;

  // Remove flag from entity bitmask.
  world[$entityMasks][generationId][eid] &= ~bitflag;

  // Remove entity from matching queries.
  queries.forEach((queryNode: QueryNode) => {
    // Remove this entity from toRemove if it exists in this query.
    queryNode.toRemove.remove(eid);

    const match = queryCheckEntity(world, queryNode, eid);

    if (match) {
      queryNode.exited.remove(eid);
      queryAddEntity(queryNode, eid);
    }

    if (!match) {
      queryNode.entered.remove(eid);
      queryRemoveEntity(world, queryNode, eid);
    }
  });

  // Remove component from entity internally.
  world[$entityComponents].get(eid)!.delete(component);
};
