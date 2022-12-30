import { Archetype, ArchetypeId, generateHashFor } from "./archetype";
import { Table } from "./table";
import { EntityId, World } from "./world";

export type Query = (world: World) => Archetype[]

// find all archetypes with at least these components by crawling right from the current archetype
const findQueryArchetypes = (world: World, id: ArchetypeId): Archetype[] => {
  const arr: Archetype[] = [world.idToArchetype.get(id)]
  const node = world.graph.nodes.get(id)
  for (const edge of node.edges.values()) {
    if (edge.add) {
      arr.push(...findQueryArchetypes(world, edge.add.id as string))
    }
  }
  return arr
}

export const defineQuery = (componentIds: number[]): Query => {
  const id = generateHashFor(componentIds);
  return (world: World) => {
    const archetypes = 
    // TODO:
    // world.archetypeToQueryCache.get(id) ||
     findQueryArchetypes(world, id);
    return archetypes;
  }
}

export const runQuery = (world: World, query: Query, cb: (archetype: [EntityId[], Table<any>[]]) => void) => {
  const archetypes = query(world)
  for (let i = 0; i < archetypes.length; i++) {
    const archetype = archetypes[i];
    cb([archetype.entities.dense, archetype.components])
  }
}
