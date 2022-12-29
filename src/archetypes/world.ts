import { Archetype, ArchetypeId } from "./archetype"
import { Graph } from "./graph"
import { ISchema } from "./table"

export type EntityId = number
export type ComponentId = EntityId

export type World = {
  cidToSchema: Map<ComponentId, ISchema>
  schemaToCid: Map<ISchema, ComponentId>
  graph: Graph
  eidCount: number
  cidCount: number
  entityToArchetype: Map<EntityId, Archetype>
  idToArchetype: Map<ArchetypeId, Archetype>
  rootArchetype: Archetype
  queryToArchetypes: Map<Query, QueryArchetype>
  size: number
}
