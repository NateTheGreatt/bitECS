# @bitecs/classic

`bitECS` is a functional and minimal ECS written in TypeScript with low-opinionation.

`@bitecs/classic` maintains compatibility with the 0.3.x `bitECS` API and uses sparse arrays for a simplified memory layout. More detail below.

```bash
npm install @bitecs/classic
```

## What is an ECS?

ECS is data-oriented design pattern for apps. In brief, it lets you treat your app as a live database where components are composable stores of data, entities point to collections of components and systems are functions that update data in components based on queries. Importantly, data is separated from behavior (described by systems), such that behavior becomes fully modular and composable.

For in-depth resources check out:

-   [What Is ECS? by Sanders Marten](https://github.com/SanderMertens/ecs-faq?tab=readme-ov-file#what-is-ecs)
-   [Data-Oriented Design by Richard Fabian](https://www.dataorienteddesign.com/dodmain/)
-   [Overwatch Gameplay Architecture and Netcode by Tim Ford](https://www.youtube.com/watch?v=W3aieHjyNvw)

## Quick start

`bitECS` provides all the concepts and tools for data-oriented design without opinionation. While entities are always ID numbers, there is no requirement on the shape a component store must have. Likewise, there is no requirement on what a system must be.

As best practices, we encourage components to be a [structure of array (SoA) format](https://en.wikipedia.org/wiki/AoS_and_SoA) and systems to be a pipe of functions.

```js
import { createWorld, addEntity, addComponent, query } from 'bitecs'

// Define components
// Components can be any storage you want, here it is an SoA
const Position = {
    x: [] as number[],
    y: [] as number[]
}

const Mass = {
    value: [] as number[]
}

// Create a world
const world = createWorld()

// Add entities to the world
const entityA = addEntity(world)
const entityB = addEntity(world)

// Add components to entities
// Entity A gets a shape of [Position, Mass]
addComponent(world, Position, entityA)
addComponent(world, Mass, entityA)

// Entity B gets a shape of [Position]
addComponent(world, Position, entityB)

// Define a system that moves entities with a Position component
const moveBody = (world) => {
    const entities = query(world, [Position]) // Returns [entityA, entityB]

    for (const entity of entities) {
        Position.x[entity] += 1
        Position.y[entity] += 1
    }
}

// Define a system that applies gravity to entities with Position and Mass components
const applyGravity = (world) => {
    const entities = query(world, [Position, Mass]) // Returns [entityA]
    const gravity = 9.81

    for (const entity of entities) {
        Position.y[entity] -= gravity * Mass.value[eid]
    }
}

// Run systems in a loop
const mainLoop = () => {
    moveBodies(world)
    applyGravity(world)
    requestAnimationFrame(mainLoop)
}

mainLoop()

// You now have a data-oriented app
// ᕕ(⌐■_■)ᕗ ♪♬
```

## World

A world is a container for ECS data. Entities are created in a world and data is queried based on the existence and shape of entities in a world. Each world is independent of all others.

```js
const world = createWorld();
```

## Entity

Entities are unique numerical indentifiers, sometimes called entity IDs or eids for short. Entities are unique across all worlds.

```js
const eidA = addEntity(world); // World has 1 entity
const eidB = addEntity(world); // World has 2 entities
removeEntity(world, eidA); // World has 1 entity
```

### Entity ID Recycling

Entity IDs are recycled after a certain number of removals. This behavior can be customized in a number of ways.

```ts
setRemovedRecycleThreshold
enableManualEntityRecycling
flushRemovedEntities
```


## Component

Components are composable stores of data that describe an attribute. For example, position and mass might all be separate components. An entity's shape is defined by the components it has.

`bitECS` is unopinionated about the shape a component store can have. Components can be any valid JS object. Note that `bitECS` uses reference to determine component identity. A [structure of array (SoA) format](https://en.wikipedia.org/wiki/AoS_and_SoA) is recommended for performance.

```js
// A SoA component (recommended for minimal memory footprint)
const Position = {
    x: [] as number[],
    y: [] as number[]
}

// A typed SoA component (recommended for threading and eliminating memory thrash)
const Position = {
    x: new Float64Array(10000),
    y: new Float64Array(10000)
}

// An AoS component
const Position = [] as { x: number, y: number }[]
```

Mutations are then handled manually based on the storage format after adding a component.

```js
addComponent(world, Position, eid);

// SoA
(Position[eid].x = 0), (Position[eid].y = 0);
Position[eid].x += 1; // Update value

// AoS
Position[eid] = { x: 0, y: 0 };
Position[eid].x += 1; // Update value
```

Removing a component updates the shape immediately.

```js
// eid gets a shape of [Position, Mass]
addComponent(world, Position, eid);
addComponent(world, Mass, eid);

// Now has a shape of just [Position]
removeComponent(world, Mass, eid);
```

## Relationships

Relationships in `bitECS` allow you to define how entities are related to each other. This can be useful for scenarios like inventory systems, parent-child hierarchies, exclusive targeting mechanics, and much more. Relations are defined using `defineRelation` and can have optional properties for additional behavior.

### Defining a Relation

You can define a relation with or without properties. Here's an example of defining a relation with data:

```ts
const Contains = defineRelation({
    initStore: () => ({ amount: [] as number[] })
});
```

### Adding Relationships

To add a relationship between entities, you use addComponent with the relation and the target entity. 

```ts
const inventory = addEntity(world);
const gold = addEntity(world);
const silver = addEntity(world);

addComponent(world, Contains(gold), inventory);
Contains(gold).amount[inventory] = 5;

addComponent(world, Contains(silver), inventory);
Contains(silver).amount[inventory] = 12;
```

### Auto Remove Subject

Some relations can automatically remove the subject entity if the target entity is removed. This is useful for maintaining hierarchies where the existence of a child entity depends on its parent entity. 

```ts
const ChildOf = defineRelation({ autoRemoveSubject: true });

const parent = addEntity(world);
const child = addEntity(world);

addComponent(world, ChildOf(parent), child);

removeEntity(world, parent);

assert(entityExists(world, child) === false);
```

In this example, when the parent entity is removed, the child entity is also automatically removed because of the autoRemoveSubject option.

### Exclusive Relationships

Exclusive relationships ensure that each subject entity can only be related to a single target entity at a time. 

```ts
const Targeting = defineRelation({ exclusive: true });

const hero = addEntity(world);
const rat = addEntity(world);
const goblin = addEntity(world);

addComponent(world, Targeting(rat), hero);
addComponent(world, Targeting(goblin), hero);

assert(hasComponent(world, Targeting(rat), hero) === false);
assert(hasComponent(world, Targeting(goblin), hero) === true);
```

In this example, the hero can only target one entity at a time. When the hero starts targeting the goblin, it stops targeting the rat.

Relationships in bitECS offer a flexible way to manage complex interactions between entities while maintaining a clean and efficient codebase.

## Query

A world is like a live database and we use queries to get information about it anytime, anywhere. Anything that can be added to an entity can be used to query for entities such as components, relationships and hierarchies and will return a snapshot of all entities matching that shape. Queries can be called inline.

```js
const eids = query(world, [Position, Mass]); // Returns number[]
```

Or can be defined globally.

```js
export const bodyQuery = defineQuery([Position, Mass]);

const eids = bodyQuery(world);
```

Relations can be queried just like components:

```ts
const children = query(world, [ChildOf(parent)])
```

## Queue

Unlike queries, queues collect changes over time, flushing when read. They cannot be called inilne and must be define globally. Each queue tracks changes independently.

`bitECS` supports enter queues, tracking entities being matching a given component shape after `addComponent` is called.

```js
const enterBodyQueue = defineEnterQueue([Positioon, Mass]);

addComponent(world, Position, eid); // enterBodyQueue(world).length = 0
addComponent(world, Mass, eid); // enterBodyQueue(world).length = 1

const eids = enterBodyQueue(world); // Returns [eid] and then optionally flushes
```

And exit queues, tracking entities that stop matching a given component shape after `removeComponent` is called.

```js
const exitBodyQueue = defineExitQueue([Position, Mass]);

removeComponent(world, Mass, eid); // exitBodyQueue(world).length = 1

const eids = exitBodyQueue(world, false); // Returns [eid] but does not flush
```

## System

Systems are what give entities behavior. By querying specific shapes, a system can compose behavior in a pipe. That is, we can know what behavior to apply to an entity by knowing what components it has, describing its traits. This separation of behavior from data is what makes data-oriented programming so flexible.

`bitECS` is unopinionated about systems, but we encourage them to be plain functions that can be called in a pipe. For exmaple:

```js
const moveBody = (world) => {
const moveBody = (world) => {
    const entities = query(world, [Position])

    for (const entity of entities) {
        Position.x[entity] += 1
        Position.y[entity] += 1
    }
}
}

const applyGravity = (world) => {
    const entities = query(world, [Position, Mass])
    const gravity = 9.81

    for (const entity of entities) {
        Position.y[entity] -= gravity * Mass.value[eid]
    }
}

// Run systems in a loop
const mainLoop = () => {
    moveBodies(world)
    applyGravity(world)
    requestAnimationFrame(mainLoop)
}

mainLoop()
```

## Prefabs

Prefabs in `bitECS` allow you to define reusable templates for entities. They can include components and relationships, making it easy to instantiate complex entities with predefined configurations.

### Declarative Definition

Prefabs can be declaratively defined using `definePrefab`. This can be done before the world is created:

```ts
const Wool = definePrefab();
const Hide = definePrefab();
```

### Dynamic Definition

Prefabs can also be dynamically added to a world during runtime:

```ts
const Gold = addPrefab(world);
// or add the built-in Prefab component to any entity
const Silver = addEntity(world);
addComponent(world, Prefab, Silver)
```

### Adding Components to Prefabs

Components can be added to declaratively defined prefabs, allowing you to define the data structure that entities instantiated from the prefab will have:

```ts
const Vitals = { health: [] };
const Animal = definePrefab([Vitals], {
    initStore: (world, eid) => {
        Vitals.health[eid] = 100
    }
});
```

### Inheriting from Other Prefabs

bitECS includes a built-in relationship called `IsA` which is used to indicate that an entity is an instance of a prefab. This relationship helps manage prefab inheritance and component composition effectively.

Prefabs can also inherit from other prefabs, allowing for hierarchical prefab structures. This is useful for creating variations of a base entity type:

```ts
const Wolf = inheritPrefab(Animal, [Contains(Hide)]);
//  the above is sugar for adding the IsA relation
const Sheep = definePrefab([IsA(Animal), Contains(Wool)]);
```

### Prefabs and Queries

Prefabs themselves do not appear in queries:

```ts
query(world, [Animal]).length === 0;
```

However, entities instantiated from prefabs can be queried using the IsA relationship:

```ts

const sheep = addEntity(world);
addComponent(world, IsA(Sheep), sheep);
hasComponent(world, Contains(Wool), sheep); // => true

const wolf = addEntity(world);
addComponent(world, IsA(Wolf), wolf);
hasComponent(world, Contains(Hide), wolf); // => true

// Query instantiated prefabs
query(world, [IsA(Animal)]); // => [sheep, wolf]
```

## Ranges

Ranges in `bitECS` allow you to define unique or shared Entity ID (EID) spaces for different worlds or for specific types of entities within a world. This can help manage EID allocation and avoid collisions across different worlds or categories.

### Defining a Range

You can define a range of EIDs using the `defineRange` function. This function takes a start and an end value, defining the EID space.

```ts
const rangeA = defineRange(0, 1000);
const rangeB = defineRange(1000, 2000);
```

### Unique EID Spaces for Each World

You can assign unique EID spaces to different worlds by using the range option when creating a world. This ensures that EIDs in one world do not overlap with those in another.

```ts
const rangeA = defineRange(0, 1000);
const rangeB = defineRange(1000, 2000);

const worldA = createWorld({}, { range: rangeA });
const worldB = createWorld({}, { range: rangeB });

addEntity(worldA); // => 0
addEntity(worldB); // => 1000
```

In this example, worldA and worldB have separate EID spaces defined by rangeA and rangeB respectively.

### Shared EID Spaces Between Worlds

If you want multiple worlds to share the same EID space, you can assign the same range to those worlds. This can be useful when you need to manage a global EID space across different worlds.

```ts

const range = defineRange(1, 2000);

const worldA = createWorld({}, { range });
const worldB = createWorld({}, { range });

addEntity(worldA); // => 1
addEntity(worldB); // => 2
```

In this example, both worldA and worldB share the same EID space defined by range, resulting in sequential EID allocation across the worlds.
Using Ranges with addEntity

### Ranges with `addEntity`

You can also specify ranges directly when adding entities to a world. This allows you to manage different categories of entities within the same world by assigning them to specific EID spaces.

```ts
const playerRange = defineRange(100, 200);
const itemRange = defineRange(5000, 9000);

addEntity(world, { range: playerRange }); // => 100
addEntity(world, { range: itemRange }); // => 5000
```

In this example, playerRange and itemRange are used to allocate EIDs for players and items, respectively, within the same world.

## Classic memory layout

`@bitecs/classic` uses sparse arrays for its memory layout, as opposed to [archetypes](https://ajmmertens.medium.com/building-an-ecs-2-archetypes-and-vectorization-fe21690805f9). This means that each entity ID corresponds directly to an array index without any indirection. This vastly simplifies memory layout and improves add/remove performance at the cost of a higher memory footprint and iteration speeds.

