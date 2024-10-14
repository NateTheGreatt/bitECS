# Quick start

`bitECS` is a flexible toolkit for data-oriented design in game development. It offers core ECS concepts without imposing strict rules:

1. Entities are always represented as ID numbers.
2. Component stores can have any structure you prefer.
3. Systems can be implemented in various ways.

For optimal performance:
- Use a [Structure of Arrays (SoA) format](https://en.wikipedia.org/wiki/AoS_and_SoA) for components.
- Implement systems as a series of functions (function pipeline).

These practices enhance data locality and processing efficiency in your ECS architecture.

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

Passing an object to `createWorld` will use the object as a context. The object will be decorated and the same reference will be returned.

```ts
const world = createWorld({
    time: {
        then: 0,
        delta: 0,
    }
})
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

### Manual Entity ID Recycling

While immediate entity ID recycling is the default behavior, it can sometimes lead to unexpected issues, especially in complex systems. To avoid this, you can tag entities before actually removing them later on:

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

To enable versioning, you can pass the `versioning` flag and the number of `versionBits` to the `createEntityIndex` function. The `versionBits` parameter determines how many bits are reserved for the version number (defaults to `8` bits which gives `255` recycles before the version resets).

```ts
const entityIndex = createEntityIndex(true, 8)
const world = createWorld(entityIndex)

const eid1 = addEntityId(entityIndex)
const eid2 = addEntityId(entityIndex)
removeEntityId(entityIndex, eid1)
const eid3 = addEntityId(entityIndex)

assert(eid1 !== eid3) // With versioning, eid1 and eid3 will not be the same
```


#### ⚠️ Caution with TypedArrays

When using entity ID versioning, be cautious if you are using the entity ID as an index into a sparse TypedArray. The versioning mechanism will technically change the entity ID by large amounts, which can lead to issues where the entity ID overshoots the length of the TypedArray. This can cause unexpected behavior in your system, because Javascript does not throw when trying to access an index that is out of bounds. Make sure your TypedArrays are large enough, or otherwise just use manual recycling.


## Component
Components are modular data containers that represent specific attributes of an entity. They define an entity's characteristics by their presence. For instance, separate components might represent position and mass.

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


### Associating Components with the World


Components are automatically registered with a world when they are first added to an entity in that world. This means that components are typically not shared between different worlds, ensuring data isolation. However, if multiple worlds share the same entity index, components can be shared across those worlds.

Components can be manually associated with a world.

```ts
createWorld({
    components: { Position: { x: [], y: [] } }
});

```

Components can be retrieved via destructuring.

```ts
const { Position } = world.components
```

Mutations are then handled manually based on the storage format after adding a component.

```ts
addComponent(world, eid, Position)

// SoA
(Position.x[eid] = 0), (Position.y[eid] = 0)
Position.x[eid] += 1; // Update value

// AoS
Position[eid] = { x: 0, y: 0 }
Position[eid].x += 1; // Update value
```

Removing a component updates the shape immediately.

```ts
// eid gets a shape of [Position, Mass]
addComponent(world, eid, Position)
addComponent(world, eid, Mass)

// Now has a shape of just [Position]
removeComponent(world, eid, Mass)
```

## Query

Queries are used to retrieve information from the world, which acts as a dynamic database. You can query for entities based on their components, relationships, or hierarchies. A query returns a list of all entities that match the specified criteria.

```ts
const entities = query(world, [Position, Mass]); // Returns number[]
```

When dealing with large numbers of entities, you can use `bufferQuery` instead of the standard `query`. The `bufferQuery` function returns a `Uint32Array` instead of a `number[]`, which can be particularly advantageous for multithreaded operations. This is because `Uint32Array` can be efficiently shared between threads using SharedArrayBuffer (SAB) or copied as raw data, making it ideal for scenarios where you need to pass query results between different execution contexts or perform parallel processing on the query results.

```ts
const entities = bufferQuery(world, [Position, Mass]); // Returns SAB-backed Uint32Array
```

Relations can be queried just like components:

```ts
const children = query(world, [ChildOf(parent)])
```

## Relationships

Relationships in `bitECS` allow you to define how entities are related to each other. This can be useful for scenarios like inventory systems, parent-child hierarchies, exclusive targeting mechanics, and much more. Relations are defined using `createRelation` and can have optional properties for additional behavior.

### Defining a Relation

You can define a relation with or without properties. Here's an example of defining a relation with data:

```ts
const Contains = createRelation(
	withStore(() => ({ amount: [] as number[] }))
)
// or
const Contains = createRelation({
	store: () => ({ amount: [] as number[] })
})
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

const relatedToEarth = query(world, [Wildcard(earth)]); // Returns [OrbitedBy(moon), IlluminatedBy(sun)]
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
const Sheep = addPrefab(world)
addComponent(world, Sheep, IsA(Animal)) // inherits Vitals component
addComponent(world, Sheep, Contains(Wool))

// component values will be inherited if an onSet and onGet observer is established
observe(world, onSet(Vitals), (eid, params) => {
    Vitals.health[eid] = params.health
})
observe(world, onGet(Vitals), (eid) => ({ 
    health: Vitals.health[eid] 
}))

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

- `world`: The ECS world object
- `hook`: An observable hook (onAdd, onRemove, onSet, or onGet)
- `callback`: A function to be called when the observed event occurs

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

The `onSet` and `onGet` hooks in `bitECS` serve as powerful mechanisms for decoupling as well as custom data storage and inheritance handling.

Note that these are not property getters/setters, as `bitECS` doesn't know the shape of your data. These are component-level gets/sets. The `onSet` hook is triggered by calling `setComponent(world, eid, Position, {x:1, y:2})`.

When using the `IsA` relation for inheritance, you need to define how data is stored, updated, and retrieved in the inheritance chain. This allows for efficient data management and proper propagation of changes through the hierarchy. To implement inheritance, you typically use a combination of custom data structures (like Maps) and the `onSet` and `onGet` hooks. The `onSet` hook defines how changes propagate through the hierarchy, while the `onGet` hook determines how data is fetched from the appropriate entity in the inheritance chain.

These hooks also provide a way to enhance modularity in your game or application. They allow you to implement cross-cutting concerns like logging, validation, or synchronization without modifying core system logic, thus promoting a more modular design.

Here's an example demonstrating how custom data storage and inheritance are implemented together, along with modularity-enhancing features:

```typescript
// Logging hook
observe(world, onSet(Position), (eid, params) => {
    console.log(`Entity ${eid} position updated to:`, params)
})

// Validation hook
observe(world, onSet(Health), (eid, params) => {
    return { value: Math.max(0, Math.min(100, params.value)) }
})

// Synchronization hook
observe(world, onSet(Inventory), (eid, params) => {
    syncWithServer(eid, 'inventory', params)
    return params
})

// Custom AoS data storage
observe(world, onSet(Position), (eid, params) => {
    Position[eid].x = params.x
    Position[eid].y = params.y
})

setComponent(world, eid, Position, { x: 10, y: 20 })

observe(world, onGet(Position), (eid) => ({
    x: Position[eid].x,
    y: Position[eid].y
}))
```

### Unsubscribing

The `observe` function returns an unsubscribe function. Call this function
to stop observing the specified changes:

```typescript
unsubscribe()
```