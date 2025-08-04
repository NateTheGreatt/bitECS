# Introduction

`bitECS` is a flexible toolkit for data-oriented design in game development. It offers core ECS concepts without imposing strict rules onto your architecture:

- Entities are numerical IDs.
- Component stores can be anything.
- No formal concept of systems, only queries.

For optimal performance:
- Use a [Structure of Arrays (SoA) format](https://en.wikipedia.org/wiki/AoS_and_SoA) for components.
- Implement systems as a series of functions (function pipeline).

These practices enhance data locality and processing efficiency in your ECS architecture, as well as feature modularity.

```ts
import { createWorld, addEntity, addComponent, query } from 'bitecs'

// Define components
const Position = {
	x: [] as number[],
	y: [] as number[],
}

// Create a world
const world = createWorld()

// Add an entity to the world
const entity = addEntity(world)

// Add component to entity
addComponent(world, entity, Position)

// Set initial values for Position component
Position.x[entity] = 0
Position.y[entity] = 0

// Define a system that moves entities with a Position component
const moveEntity = (world) => {
	const entities = query(world, [Position])

	for (const eid of entities) {
		Position.x[eid] += 1
		Position.y[eid] += 1
	}
}

// Run system in a loop
const mainLoop = () => {
	moveEntity(world)
	requestAnimationFrame(mainLoop)
}

mainLoop()
```

## World

A world is a container for ECS data. Entities are created in a world and data is queried based on the existence and shape of entities in a world. Each world is independent of all others.

```ts
const world = createWorld()
```

### Options

Passing an object to `createWorld` will use the object as a custom context, if desired. `bitECS` will treat the passed-in reference as a world, and the same reference will be returned.

```ts
const context = {
    time: {
        then: 0,
        delta: 0,
    }
}
const world = createWorld(context)
assert(world === context) // true
```

Passing an `entityIndex` uses the entity index to share an EID space between worlds.

```ts
const entityIndex = createEntityIndex()
const worldA = createWorld(entityIndex)
const worldB = createWorld(entityIndex)

addEntity(worldA) // 1
addEntity(worldB) // 2
addEntity(worldA) // 3
```

You can pass either in any order.

```ts
createWorld({ data: 1 }, entityIndex)
createWorld(entityIndex, { data: 1 })
```

## Entity

Entities are unique numerical identifiers, sometimes called entity IDs or eids for short. Entities are unique across all worlds, unless worlds have a shared entity index.

```ts
const eid = addEntity(world)
removeEntity(world, eid)
```

### Entity ID Recycling

Entity IDs are recycled immediately after removal.

```ts
const eid1 = addEntity(world)
const eid2 = addEntity(world)
removeEntity(world, eid1)
const eid3 = addEntity(world)

assert(eid1 === eid3)
```

### Manual Entity ID Recycling (Recommended)

Manual entity ID recycling lets you control exactly when entities are removed from the world. Instead of immediately recycling entity IDs when removed, you can mark entities for removal and process them later in batches.

While immediate recycling is the default, deferring entity removal through manual recycling helps prevent bugs in complex systems where components or systems may still reference recently removed entities. This is especially important when iterating over query results, since an entity removed in one iteration could be referenced in a later iteration. Here's how to implement manual recycling:

```ts
const Removed = {}

const markEntityForRemoval = (world: World, eid: number): void => {
    addComponent(world, eid, Removed)
}

const removeMarkedEntities = (world: World): void => {
    for (const eid of query(world, [Removed])) {
        removeEntity(world, eid)
    }
}

const eid = addEntity(world)
markEntityForRemoval(world, eid)

// sometime later...
removeMarkedEntities(world)
```

### Entity ID Versioning with Entity Index

Entity ID versioning is an alternative mechanism that helps in managing recycled entity IDs more effectively. When versioning is enabled, each entity ID carries a version number that increments every time the ID is recycled. This helps in distinguishing between different lifetimes of the same entity ID, preventing potential issues that arise from immediate recycling.

To enable versioning, pass `withVersioning()` as a first argument, and optionally specify the number of version bits. Version bits determine how many times an ID can be recycled before resetting (default is 12 bits = 4096 recycles).

Using version bits reduces the maximum number of possible entities, since bits are split between versioning and entity IDs. You are free to tune this to best fit your use case. Here are some sensible options:

- 8 bits: 16M entities/256 recycles
- 10 bits: 4M entities/1K recycles
- 12 bits: 1M entities/4K recycles
- 14 bits: 262K entities/16K recycles
- 16 bits: 65K entities/65K recycles

```ts
const entityIndex = createEntityIndex(withVersioning(8))
const world = createWorld(entityIndex)

const eid1 = addEntityId(entityIndex)
const eid2 = addEntityId(entityIndex)
removeEntityId(entityIndex, eid1)
const eid3 = addEntityId(entityIndex)

assert(eid1 !== eid3) // With versioning, eid1 and eid3 will not be the same
```


#### ⚠️ Caution with TypedArrays

When using entity ID versioning, be cautious if you are using the entity ID as an index into a sparse TypedArray. The versioning mechanism will technically change the entity ID by large amounts, which can lead to issues where the entity ID overshoots the length of the TypedArray. This can cause unexpected behavior in your system, because Javascript does not throw when trying to access an index that is out of bounds. Make sure your TypedArrays are large enough, or otherwise just handle recycling manually.


## Component
Components are modular data containers that represent specific attributes of an entity. They define an entity's characteristics by their presence. For instance, separate components might represent position, velocity, and mass.

In `bitECS`, you have flexibility in choosing the data structure for components. Any valid JavaScript reference can serve as a component, with its identity determined by reference. For concise syntax with optimal performance, a [structure of arrays (SoA) format](https://en.wikipedia.org/wiki/AoS_and_SoA) is recommended.


```ts
// A SoA component (recommended for minimal memory footprint)
const Position = {
	x: [] as number[],
	y: [] as number[],
}

// A typed SoA component (recommended for threading and eliminating memory thrash)
const Position = {
	x: new Float64Array(10000),
	y: new Float64Array(10000),
}

// An AoS component (performant so long as the shape is small and there are < 100k objects)
const Position = [] as { x: number; y: number }[]
```


### Associating Components with Worlds

Internally, components are automatically registered with a world when first added to an entity within that world. They can also be explicitly registered with `registerComponent`. However, it is your responsibility as the user to effectively manage the data stores for components in between all worlds in use.

When multiple worlds are in use, there are two general approaches. One for maintaining data store isolation between worlds, and one for sharing data stores between worlds.

1. Define components separately for each world. This approach ensures complete isolation between worlds, as each world maintains its own set of components. This is the default behavior and is recommended for most use cases. Note that component storage is left entirely up to you, and there is no explicit need to store components on a `components` property on the world. You can store them wherever you want.

```ts
// When defined on the world...
const world = createWorld({
    components: { 
        Position: Array(1e5).fill(3).map(n => new Float32Array(n)) 
    }
});

// ...components can then be cleanly destructured from the world
const { Position } = world.components
```

2. If multiple worlds share the same entity index, it becomes possible to share components across these worlds. This controlled approach allows for component stores to be defined globally, while still preserving the overall principle of world separation.

```ts
// When defined globally...
const Position = Array(1e5).fill(3).map(n => new Float32Array(n))

// ...components can be retrieved via importing.
import { Position } from './components'

// if using multiple worlds with global components, you MUST use a shared entity index
const entityIndex = createEntityIndex()
const world1 = createWorld(entityIndex)
const world2 = createWorld(entityIndex)
```

Mutations are then handled manually based on the storage format after adding a component.

```ts
addComponent(world, eid, Position)

// SoA
(Position.x[eid] = 0), (Position.y[eid] = 0)
Position.x[eid] += 1

// AoS
Position[eid] = { x: 0, y: 0 }
Position[eid].x += 1

// Array of Typedarrays
const pos = Position[eid]
pos[0] += 1

// Use a setter (needs to be setup first, see observer docs for more info)
addComponent(world, eid, set(Position, { x: 1, y: 1 }))
```

Removing a component updates the shape immediately.

```ts
// eid gets a shape of [Position, Mass]
addComponent(world, eid, Position)
addComponent(world, eid, Mass)

// Now has a shape of just [Position]
removeComponent(world, eid, Mass)
```

These functions are composable to a degree:

```ts
addComponent(world, eid, Position, Velocity, Mass)
removeComponent(world, eid, Position, Velocity)
```

## Query

Queries are used to retrieve information from the world, which acts as a dynamic database. You can query for entities based on their components, relationships, or hierarchies. A query returns a list of all entities that match the specified criteria.

```ts
const entities = query(world, [Position, Mass]); // Returns number[]
```

### Query Operators

Queries can be modified using operators to create more complex conditions:

- `And`/`All`: Matches entities that have ALL of the specified components (this is the default behavior)
- `Or`/`Any`: Matches entities that have ANY of the specified components
- `Not`/`None`: Matches entities that have NONE of the specified components

Here are some examples:
```ts
// Match entities with Position AND Velocity
query(world, [Position, Velocity])
query(world, [And(Position, Velocity)])
query(world, [All(Position, Velocity)])

// Match entities with Position OR Velocity
query(world, [Or(Position, Velocity)])

// Match entities with Position but NOT Velocity
query(world, [Position, Not(Velocity)])

// Complex combinations
query(world, [
  Position,                   // Must have Position
  Or(Health, Shield),         // Must have either Health OR Shield
  Not(Stunned, Paralyzed)     // Must NOT have Stunned AND must NOT have Paralyzed
])

// Using Any/All/None aliases
query(world, [
  All(Position, Velocity),    // Same as And()
  Any(Health, Shield),        // Same as Or()
  None(Stunned, Paralyzed)    // Same as Not() 
])

```

### Hierarchical Queries

`queryHierarchy` returns entities in **topological order**—parents before children—based on a relation (usually a `ChildOf` relation).

```ts
const ChildOf = createRelation()

// Query all entities that have Position **in hierarchy order**
for (const eid of queryHierarchy(world, ChildOf, [Position])) {
    // parent entities are guaranteed to be processed before children
}
```

Other helpers:

| helper | description |
| ------ | ----------- |
| `queryHierarchyDepth(world, ChildOf, depth)` | All entities exactly at `depth` |
| `getHierarchyDepth(world, eid, ChildOf)`     | Cached depth for a single entity |
| `getMaxHierarchyDepth(world, ChildOf)`       | Current maximum depth of the tree |

The hierarchy system internally caches depth calculations and only recalculates when relation changes occur. Subsequent queries have minimal overhead.

### Inner Query

By default, entity removals are deferred until queries are called. This is to avoid removing entities from a query during iteration. 

However, this has a caveat in the case of calling a query while iterating results of another related query. This will undesireably cause entities to be removed during iteration of a query.

Inner queries provide a way to perform queries without triggering the removal of entities. This is particularly useful when you need to iterate over entities without modifying the world state. By using inner queries, you can avoid the automatic removal behavior that occurs during regular queries, ensuring that entities are not removed during iteration.

```ts
// This triggers entity removals, then queries
for (const entity of query(world, [Position, Velocity])) {

  // This does not trigger entity removals
  for (const innerEntity of innerQuery(world, [Mass])) {}
}
```

Note: You can use query inside of another query loop with manual entity recycling, avoiding the need for `innerQuery`.


## Relationships

Relationships in `bitECS` allow you to define how entities are related to each other. This can be useful for scenarios like inventory systems, parent-child hierarchies, exclusive targeting mechanics, and much more. Relations are defined using `createRelation` and can have optional properties for additional behavior.

Note: The relation API is a dual-API. It can either take an options object, or composed with optional composables.

### Defining a Relation

You can create a new type of relationship with or without data properties. Here's an example of defining a relation with data:

```ts
const Contains = createRelation(
	withStore(() => ({ amount: [] as number[] }))
)
// or
const Contains = createRelation({
	store: () => ({ amount: [] as number[] })
})
```

Relations can be queried just like components:

```ts
const ChildOf = createRelation(withAutoRemoveSubject)
const children = query(world, [ChildOf(parent)])
```

### Adding Relationships

To add a relationship between entities, you use addComponent with the relation and the target entity.

```ts
const inventory = addEntity(world)
const gold = addEntity(world)
const silver = addEntity(world)

addComponent(world, inventory, Contains(gold))
Contains(gold).amount[inventory] = 5

addComponent(world, inventory, Contains(silver))
Contains(silver).amount[inventory] = 12
```

### Auto Remove Subject

Relations can be configured to automatically remove the subject entity if the target entity is removed. This is useful for maintaining hierarchies where the existence of a child entity depends on its parent entity.

```ts
const ChildOf = createRelation(withAutoRemoveSubject)
// or
const ChildOf = createRelation({ autoRemoveSubject: true })

const parent = addEntity(world)
const child = addEntity(world)

addComponent(world, child, ChildOf(parent))

removeEntity(world, parent)

assert(entityExists(world, child) === false)
```

In this example, when the parent entity is removed, the child entity is also automatically removed because of the autoRemoveSubject option.

### Exclusive Relationships

Exclusive relationships ensure that each subject entity can only be related to a single target entity at a time.

```ts
const Targeting = createRelation(makeExclusive)
// or
const Targeting = createRelation({ exclusive: true })

const hero = addEntity(world)
const rat = addEntity(world)
const goblin = addEntity(world)

addComponent(world, hero, Targeting(rat))
addComponent(world, hero, Targeting(goblin))

assert(hasComponent(world, hero, Targeting(rat)) === false)
assert(hasComponent(world, hero, Targeting(goblin)) === true)
```

In this example, the hero can only target one entity at a time. When the hero starts targeting the goblin, it stops targeting the rat.

### Get targets of a Relationship for entity

To retrieve all target entities related to a specific entity through a particular relation, you can use the `getRelationTargets` function. This function returns an array of entity IDs that are targets of the specified relation for the given entity.

```ts
const inventory = addEntity(world)
const gold = addEntity(world)
const silver = addEntity(world)

addComponent(world, inventory, Contains(gold))
addComponent(world, inventory, Contains(silver))

const targets = getRelationTargets(world, inventory, Contains); // Returns [gold, silver]
```

### Relationship Wildcards

When querying for relationship pairs, it is often useful to be able to find all instances for a given relationship or target. `'*'` or `Wildcard` can be used to to accomplish this.

```ts
const gold = addEntity(world)
const clothes = addEntity(world)
const arrow = addEntity(world)

const chest = addEntity(world)
const backpack = addEntity(world)
const quiver = addEntity(world)

addComponent(world, chest, Contains(gold))
addComponent(world, backpack, Contains(clothes))
addComponent(world, quiver, Contains(arrow))

query(world, [Contains('*')]); // [chest, backpack, quiver]
query(world, [Contains(Wildcard)]); // [chest, backpack, quiver]
```

### Inverted Wildcard Search

In some cases, you may want to find all components that are related to a specific target entity, regardless of the relationship type. This can be achieved using `Wildcard` relation with the target entity as the argument. For example, if you want to find all components that are related to the entity `earth` in any way, you can use the following query:

```ts
const earth = addEntity(world)
const moon = addEntity(world)
const sun = addEntity(world)

addComponent(world, earth, OrbitedBy(moon))
addComponent(world, earth, IlluminatedBy(sun))

const relatedToEarth = query(world, [Wildcard(earth)]); // Returns [moon, sun]
```

### Wildcard Search on Relations

You can also use wildcards to search for all entities involved in a specific type of relationship, regardless of their role (source or target). This is done by using `Wildcard` with the relation itself:
```ts
const parent1 = addEntity(world)
const parent2 = addEntity(world)
const child1 = addEntity(world)
const child2 = addEntity(world)

addComponent(world, child1, ChildOf(parent1))
addComponent(world, child2, ChildOf(parent2))

// Find all entities that are parents (have children)
const parents = query(world, [Wildcard(ChildOf)]) // Returns [parent1, parent2]

// Find all entities that are children (have parents)
const children = query(world, [ChildOf(Wildcard)]) // Returns [child1, child2]
```

## System

Systems define how entities behave in a data-oriented programming approach. They work by querying for entities with specific components and applying behavior based on those components. This separation of behavior (systems) from data (components) provides flexibility in game design.

While `bitECS` doesn't enforce a specific system implementation, it is recommended to using simple functions that can be chained together. Here's an example:

```ts
const moveBody = (world) => {
	const entities = query(world, [Position])

	for (const entity of entities) {
		Position.x[entity] += 1
		Position.y[entity] += 1
	}
}

const applyGravity = (world) => {
	const entities = query(world, [Position, Mass])
	const gravity = 9.81

	for (const entity of entities) {
		Position.y[entity] -= gravity * Mass.value[entity]
	}
}

const update = () => {
	moveBody(world)
	applyGravity(world)
	requestAnimationFrame(update)
}

update()
```

## Prefabs

Prefabs in `bitECS` allow you to define reusable templates for entities. They can include components and relationships, making it easy to instantiate complex entities with predefined configurations.

```ts
const Gold = addPrefab(world)
```

Components can be added to prefabs, creating a template for entities. When an entity is instantiated from a prefab, it inherits all the components and their initial values from that prefab. This allows you to define a consistent data structure and default values for a category of similar entities:

```ts
const Vitals = { health: [] }
const Animal = addPrefab()

addComponent(world, Animal, Vitals)
Vitals.health[Animal] = 100
```

### Inheritance

`bitECS` includes a built-in relationship called `IsA` which is used to indicate that an entity is an instance of a prefab. This relationship helps manage prefab inheritance and component composition effectively.

```ts
// component values will be inherited if onSet and onGet observers are createdfirst
observe(world, onSet(Vitals), (eid, params) => {
    Vitals.health[eid] = params.health
})
observe(world, onGet(Vitals), (eid) => ({ 
    health: Vitals.health[eid] 
}))

const Sheep = addPrefab(world)
addComponent(world, Sheep, IsA(Animal)) // inherits Vitals component
addComponent(world, Sheep, Contains(Wool))
```

### Prefabs and Queries

Prefabs themselves do not appear in queries:

```ts
query(world, [Animal]).length === 0
```

However, entities instantiated from prefabs can be queried using the `IsA` relationship:

```ts
const sheep = addEntity(world)
addComponent(world, sheep, IsA(Sheep))
hasComponent(world, sheep, Contains(Wool)); // Returns true

const wolf = addEntity(world)
addComponent(world, wolf, IsA(Wolf))
hasComponent(world, wolf, Contains(Hide)); // Returns true

// Query instantiated prefabs
query(world, [IsA(Animal)]); // Returns [sheep, wolf]
```

## Observers

The `observe` function allows you to subscribe to changes in entity components.
It provides a way to react to component additions, removals, or updates for entities
that match a specific query.

```typescript
const unsubscribe = observe(world, hook, callback)
```

- `hook`: onAdd, onRemove, onSet, or onGet
- `callback`: Called when the observed event occurs
- `unsubscribe`: Call to stop observing

### Observing component adds and removes

The `onAdd` and `onRemove` hooks can be used with any valid query terms, including components, `Or`, `Not`, and other query operators. This allows for complex observation patterns. Here are some examples:

```typescript
observe(world, onAdd(Position, Not(Velocity)), (eid) => {
    console.log(`Entity ${eid} added with Position and without Velocity`)
})

observe(world, onRemove(Health), (eid) => {
    console.log(`Entity ${eid} removed Health component`)
})
```

### Observing component updates
The `onSet` and `onGet` hooks in `bitECS` allow you to implement custom getters and setters for component data. Each component can have its own `onSet` and `onGet` hooks that control how data is written and read.

These hooks operate at the component level rather than individual properties. When you use the `set` function with `addComponent`, the `onSet` hook for that component is triggered with the entire data object:
```ts
addComponent(world, eid, set(Position, {x:1, y:2}))
```

The `IsA` relation for inheritance requires defining data handling in the component hierarchy. Both `onSet` and `onGet` hooks are needed to effectively propagate changes:

- `onSet`: Defines how data is persisted to the custom data store for an entity
- `onGet`: Determines how data is retrieved from the custom data store for an entity

These hooks are meant to give you a way to interface with custom data structures of your own, ensuring consistent inheritance behavior and proper propagation of data through the hierarchy.

Additionally, they provide a way to enhance modularity in your game or application. By allowing implementation of cross-cutting concerns like logging, validation, or synchronization without modifying core system logic, these hooks promote a more modular design.

Here's an example demonstrating how custom data storage and inheritance are implemented together, along with modularity-enhancing features:

```typescript
// Logging
observe(world, onSet(Position), (eid, params) => {
    console.log(`Position added to ${eid}:`, params)
})

// Computed values
observe(world, onSet(Health), (eid, params) => {
    return { value: Math.max(0, Math.min(100, params.value)) }
})

// Network synchronization
observe(world, onSet(Inventory), (eid, params) => {
    syncWithServer(eid, 'inventory', params)
    return params
})

// Custom AoS data storage
observe(world, onSet(Position), (eid, params) => { Position[eid] = params })
observe(world, onGet(Position), (eid) => Position[eid])
addComponent(world, eid, set(Position, { x: 10, y: 20 }))
```
