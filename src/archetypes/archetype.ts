import { addGraphEdge, createGraph, createNode } from "./graph.js"
import { createTable, ISchema, moveTableRowTo, removeTableRow, addTableRow, Table } from "./table.js"
import { createSparseSet, SparseSet } from "./util.js"
import { ComponentId, EntityId, World } from "./world.js"

/*********
 * Types *
 ********/

export type ArchetypeId = string

export type Archetype = {
  id: string // hash of componentIds
  componentIds: ComponentId[]
  components: Table<any>[]
  entities: SparseSet<EntityId>
  entityIndices: EntityId[] // must keep aligned with component tables
}

/*******
 * API *
 ******/

export const generateHashFor = (componentIds: ComponentId[]) => componentIds.sort().reduce((a,v) => a + '-' + v, "")

export const createArchetype = (world: World, componentIds: ComponentId[]): Archetype => {
  const id = generateHashFor(componentIds)
  const components = componentIds.map(cid => {
    const schema = world.cidToSchema.get(cid)
    if (schema === undefined) throw new Error(`schema not found for cid ${cid}`)
    // TODO: start small and resize table?
    return createTable(schema, world.size)
  })
  const archetype = {
    id,
    componentIds,
    components,
    entities: createSparseSet<EntityId>(),
    entityIndices: [],
  }
  world.idToArchetype.set(id, archetype)
  return archetype
}


export const createWorld = (size: number = 1000): World => {
  const world = {
    cidToSchema: new Map(),
    schemaToCid: new Map(),
    graph: createGraph(),
    eidCount: 0,
    cidCount: 0,
    entityToArchetype: new Map(),
    idToArchetype: new Map(),
    rootArchetype: null,
    size,
  }

  world.rootArchetype = createArchetype(world as World, []);
  world.graph.nodes.set(world.rootArchetype.id, createNode(world.rootArchetype.id))

  return world
}

export const addEntity = (world: World) => {
  const eid = world.eidCount++ as EntityId
  // TODO: preallocate
  world.entityToArchetype.set(eid, world.rootArchetype)
  world.rootArchetype.entities.add(eid)
  return eid
}

export const registerComponent = <S extends ISchema>(world: World, schema: S): ComponentId => {
  const cid = world.cidCount++ as ComponentId
  world.cidToSchema.set(cid, schema)
  world.schemaToCid.set(schema, cid)

  const archetype = createArchetype(world, [cid])
  world.idToArchetype.set(archetype.id, archetype)

  const node = createNode(archetype.id)
  const root = world.graph.nodes.get(world.rootArchetype.id)
  addGraphEdge(world.graph, root, node)

  return cid
}

export const moveEntityArchetype = (world: World, archetypeFrom: Archetype, archetypeTo: Archetype, eid: EntityId) => {
  const index = archetypeFrom.entityIndices[eid] || 0

  archetypeFrom.entities.delete(eid)
  delete archetypeFrom.entityIndices[eid]

  let j = 0
  const len = archetypeFrom.components.length > archetypeTo.components.length 
    ? archetypeFrom.components.length 
    : archetypeTo.components.length
  for (let i = 0; i < len; i++) {
    const componentFrom = archetypeFrom.components[i]
    const componentTo = archetypeTo.components[i]
    if (componentFrom && componentTo) {
      const tmp = moveTableRowTo(componentFrom, componentTo, index)
      if (j !== undefined && tmp !== j) throw new Error(`tables for archetype ${archetypeTo.id} not aligned`)
      j = tmp
    } else if (componentFrom && !componentTo) {
      removeTableRow(componentFrom, index);
    } else if (!componentFrom && componentTo) {
      j = addTableRow(componentTo);
    }
  }

  world.entityToArchetype.set(eid, archetypeTo)
  archetypeTo.entityIndices[eid] = j
  
  return j
}

export const addComponent = <T extends ISchema>(world: World, cid: number, eid: EntityId, cb?: (component: Table<T>, eid: EntityId) => void) => {
  // const cid = world.schemaToCid.get(schema)
  // if (cid === undefined) throw new Error('cid is undefined')
  if (eid === undefined) throw new Error('eid is undefined')

  // get entity's current archetype
  const archetype = world.entityToArchetype.get(eid)
  if (archetype === undefined) throw new Error(`current archetype not found for eid ${eid} when adding cid ${cid}`)

  // get the archetype's node
  const archetypeNode = world.graph.nodes.get(archetype.id)
  if (archetypeNode === undefined) throw new Error(`archetype node not found for eid ${eid} when adding archetype ${archetype.id}`)

  // get edge for component we're adding
  const nextEdge = archetypeNode.edges.get(`-${cid}`)

  // if edge doesn't exist yet, create it
  let nextArchetype: Archetype
  if (nextEdge === undefined) {
    nextArchetype = createArchetype(world, [...archetype.componentIds, cid])
    addGraphEdge(world.graph, archetypeNode, createNode(nextArchetype.id))
  } else {
    // else get the existing archetype
    if (nextEdge.add === undefined) throw new Error(`next node not found on edge of archetype ${archetype.id}`)
    nextArchetype = world.idToArchetype.get(nextEdge.add.id as string);
  }

  if (nextArchetype === undefined) throw new Error(`next archetype not found for eid ${eid} when adding cid ${cid}`)
  
  const entityIndex = moveEntityArchetype(world, archetype, nextArchetype, eid)
  const componentIndex = nextArchetype.componentIds.findIndex(_cid => _cid === cid)

  if (cb) cb(nextArchetype.components[componentIndex] as Table<T>, entityIndex)

  return [nextArchetype.components[componentIndex], entityIndex]
}

export const removeComponent = <T extends ISchema>(world: World, cid: number, eid: EntityId, cb?: (component: Table<T>, eid: EntityId) => void) => {
  // const cid = world.schemaToCid.get(schema)
  // if (cid === undefined) throw new Error('cid is undefined')
  if (eid === undefined) throw new Error('eid is undefined')

  // get entity's current archetype
  const archetype = world.entityToArchetype.get(eid)
  if (archetype === undefined) throw new Error(`current archetype not found for eid ${eid} when adding cid ${cid}`)

  // get the archetype's node
  const archetypeNode = world.graph.nodes.get(archetype.id)
  if (archetypeNode === undefined) throw new Error(`archetype node not found for eid ${eid} when adding archetype ${archetype.id}`)

  // get edge for component we're removing
  const prevEdge = archetypeNode.edges.get(`-${cid}`)

  // if edge doesn't exist yet, create it
  let prevArchetype: Archetype
  if (prevEdge === undefined) {
    const prevArchId = archetype.id.replace(`-${cid}`,'')
    prevArchetype = world.idToArchetype.get(prevArchId) || createArchetype(world, archetype.componentIds.filter(_cid => _cid !== cid))
    addGraphEdge(world.graph, world.graph.nodes.get(prevArchId), archetypeNode)
  } else {
    // else get the existing archetype
    if (prevEdge.remove === undefined) throw new Error(`previous node not found on edge of archetype ${archetype.id}`)
    prevArchetype = world.idToArchetype.get(prevEdge.remove.id as string);
  }

  if (prevArchetype === undefined) throw new Error(`next archetype not found for eid ${eid} when adding cid ${cid}`)
  
  const entityIndex = moveEntityArchetype(world, archetype, prevArchetype, eid)
  const componentIndex = prevArchetype.componentIds.findIndex(_cid => _cid === cid)

  if (cb) cb(prevArchetype.components[componentIndex] as Table<T>, entityIndex)

  return [prevArchetype.components[componentIndex], entityIndex]
}

export const getComponent = <T extends ISchema>(world: World, cid: number, eid: EntityId, cb?: (component: Table<T>, eid: EntityId) => void) => {
  // const cid = world.schemaToCid.get(schema)
  const archetype = world.entityToArchetype.get(eid)
  const index = archetype.componentIds.findIndex(_cid => _cid === cid)
  if (cb) cb(archetype.components[index] as Table<T>, archetype.entityIndices[eid])
  return [archetype.components[index], archetype.entityIndices[eid]]
}


export const getArchetype = (world: World, eid: EntityId) => world.entityToArchetype.get(eid)
