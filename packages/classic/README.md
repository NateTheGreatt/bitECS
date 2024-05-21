# @bitecs/classic

`bitECS` is a functional and minimal ECS written in TypeScript with low-opinionation.

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
const moveBody((world) => {
    const entities = query(world, [Position]) // Returns [entityA, entityB]

    for (const entity of entities) {
        Position.x[entity] += 1
        Position.y[entity] += 1
    }
})

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
removeEntity(world); // World has 1 entity
```

## Component

Components are composable stores of data that describe an attribute. For example, position and mass might all be separate components. An entity's shape is defined by the components it has.

`bitECS` is unopinionated about the shape a component store can have. It can be anything from a string to a structure of arrays to an array of structures. Note that `bitECS` uses reference to determine component identity. A [structure of array (SoA) format](https://en.wikipedia.org/wiki/AoS_and_SoA) is recommended for performance.

```js
// A SoA component (recommended)
const Position = {
    x: [] as number[],
    y: [] as number[]
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

## Hierarchies

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

## Queue

Unlike queries, queues collect changes over time, flushing when read. They cannot be called inilne and must be define globally. Each queue tracks changes independently.

`bitECS` supports enter queues, tracking entities being matching a given component shape after `addComponent` is called.

```js
const enterBody = defineEnterQueue([Positin, Mass]);

addComponent(world, Position, eid); // enterBody.length = 0
addComponent(world, Mass, eid); // enterBody.length = 1

const eids = query(world, enterBody); // Returns [eid] and then flushes
```

And exit queues, tracking entities that stop matching a given component shape after `removeComponent` is called.

```js
const exitBody = defineExitQueue([Position, Mass]);

removeComponent(world, Mass, eid); // exitBody.length = 1

const eids = query(world, exitBody); // Returns [eid] and then flushes
```

## System

Systems are what give entities behavior. By querying specific shapes, a system can compose behavior in a pipe. That is, we can know what behavior to apply to an entity by knowing what components it has, describing its traits. This separation of behavior from data is what makes data-oriented programming so flexible.

`bitECS` is unopinionated about systems, but we encourage them to be plain functions that can be called in a pipe. For exmaple:

```js
const moveBody((world) => {
    const entities = query(world, [Position])

    for (const entity of entities) {
        Position.x[entity] += 1
        Position.y[entity] += 1
    }
})

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
