# Serialization

Serialization is completely decoupled from `bitECS` and instead builds its features externally by utilizing the `bitECS` API. It provides three separate serialization APIs that work synergistically together to handle different serialization needs. These can be imported from `bitecs/serialization`.

All serializers support:
- Efficient binary serialization using TypedArrays or regular arrays
- Mapping between different entity IDs during deserialization

Choose the appropriate serializer based on your specific needs:
- SoA for raw component data transfer
- Observer for add/remove component tracking 
- Snapshot for complete state capture and restoration

## SoA (Structure of Arrays) Serialization

The SoA serializer operates directly on raw Structure of Arrays (SoA) data structures, without any dependency on `bitECS`. It efficiently serializes component data for network replication and data transfer between systems.

The serializer provides two main functions:

- `createSoASerializer(components)` - Creates a serializer for the given components
- `createSoADeserializer(components)` - Creates a deserializer for the given components

Data type tags can be used to define components with regular arrays, which lets the serializer know what data type to serialize the number in the array as:

- `u8()`, `i8()` - 8-bit unsigned/signed integers
- `u16()`, `i16()` - 16-bit unsigned/signed integers  
- `u32()`, `i32()` - 32-bit unsigned/signed integers
- `f32()` - 32-bit floats
- `f64()` - 64-bit floats (default if unspecified)

The type tags are used to annotate regular, non-typed arrays for proper serialization. TypedArrays like `Uint8Array` can be used directly without tags since their type is already known:

```ts
import { createSoASerializer, createSoADeserializer, f32 } from 'bitecs/serialization'

const Position = { x: f32([]), y: f32([]) }
const Velocity = { vx: f32([]), vy: f32([]) }
const Health = new Uint8Array(1e5)

const components = [Position, Velocity, Health]

const serialize = createSoASerializer(components)
const deserialize = createSoADeserializer(components)

const eid = 1

// Add data to components
Position.x[eid] = 10.5; Position.y[eid] = 20.2
Velocity.vx[eid] = 1.3; Velocity.vy[eid] = 2.4
Health[eid] = 100

// Serialize component data for entities
// Usually you would use query results here
const buffer = serialize([eid])

// Zero out components to prepare for deserialization
Position.x[eid] = 0; Position.y[eid] = 0
Velocity.vx[eid] = 0; Velocity.vy[eid] = 0
Health[eid] = 0

// Deserialize back into components
deserialize(buffer)

// Assert component data was deserialized correctly
console.assert(Position.x[eid] === 10.5)
console.assert(Position.y[eid] === 20.2)
console.assert(Velocity.vx[eid] === 1.3)
console.assert(Velocity.vy[eid] === 2.4)
console.assert(Health[eid] === 100)
```

### ID Mapping

When deserializing data, you may need to map entity IDs from the source data to different IDs in the target world. This is common in scenarios like:

- Network replication where client and server entity IDs differ
- Loading saved games where entity IDs need to be regenerated
- Copying entities between different worlds

ID mapping is supported by passing an optional Map to the deserializer:

```ts
 // Map entity 1 to 10
const idMap = new Map([[1, 10]])

// entity id 1 inside of the packet will have its data written to entity id 10
deserialize(buffer, idMap)
```
### Array of arrays
The bitECS serialization system supports nested arrays (arrays of arrays) as component properties. This feature allows you to store more complex data structures while maintaining efficient binary serialization.
```ts
export const array = <T extends any[] = []>(type: TypeSymbol | T = $f32) => { /*...*/ }
```
The array() function annotates an array to indicate its elements' type for proper serialization:
- array($f32) - Creates an array of 32-bit float values (default)
- array($u8) - Creates an array of 8-bit unsigned integers
- array(array($f32)) - Creates a nested array (array of arrays of floats)

#### Usage Examples:
##### Basic Usage with Primitive Types
```ts
import { createSoASerializer, createSoADeserializer, array, $f32 } from 'bitecs/serialization'

// Define a component with an array property
const Waypoints = {
    // Array of coordinate pairs stored as f32 values
    points: array($f32)
}

const components = [Waypoints]

const serialize = createSoASerializer(components)
const deserialize = createSoADeserializer(components)

const eid = 1

// Add array data to component
Waypoints.points[eid] = [10.5, 20.2]

// Serialize component data
const buffer = serialize([eid])

// Zero out component to prepare for deserialization
Waypoints.points[eid] = null

// Deserialize back into component
deserialize(buffer)

// Assert array data was deserialized correctly
console.assert(Waypoints.points[eid].length === 1)
console.assert(Waypoints.points[eid][0] === 10.5)
console.assert(Waypoints.points[eid][1] === 20.2)
```
##### Multi-level Nesting Example
```ts
import { createSoASerializer, createSoADeserializer, array, $u8 } from 'bitecs/serialization'

// Define a component with a nested array structure
const Inventory = {
    // Array of inventory pages, each containing arrays of item IDs
    pages: array(array($u8))
}

const components = [Inventory]

const serialize = createSoASerializer(components)
const deserialize = createSoADeserializer(components)

const eid = 1

// Define a complex nested structure
const inventoryData = [
    [1, 2, 3],       // Page 1: items 1, 2, 3
    [10, 20],        // Page 2: items 10, 20
    [100, 101, 102]  // Page 3: items 100, 101, 102
]

// Add the nested array data to component
Inventory.pages[eid] = inventoryData

// Serialize component data for entity
const buffer = serialize([eid])

// Zero out component to prepare for deserialization
Inventory.pages[eid] = []

// Deserialize back into component
deserialize(buffer)

// Assert nested array data was deserialized correctly
console.assert(Inventory.pages[eid].length === 3)
console.assert(Inventory.pages[eid][0].length === 3)
console.assert(Inventory.pages[eid][0][0] === 1)
console.assert(Inventory.pages[eid][0][1] === 2)
console.assert(Inventory.pages[eid][0][2] === 3)
console.assert(Inventory.pages[eid][1].length === 2)
console.assert(Inventory.pages[eid][1][0] === 10)
console.assert(Inventory.pages[eid][1][1] === 20)
console.assert(Inventory.pages[eid][2].length === 3)
console.assert(Inventory.pages[eid][2][0] === 100)
console.assert(Inventory.pages[eid][2][1] === 101)
console.assert(Inventory.pages[eid][2][2] === 102)
```
##### Mixed Component Types Example
```ts
import { createSoASerializer, createSoADeserializer, array, $f32, $u8 } from 'bitecs/serialization'
const Character = {
    position: array<[number, number]>($f64),
    inventory: array<number[]>($u8),
    skills: array(array($f64))
}

const components = [Character]

const serialize = createSoASerializer(components)
const deserialize = createSoADeserializer(components)

const eid = 1

// Set regular component data
Character.position[eid] = [10.5, 20.4]

// Set array component data
Character.inventory[eid] = [1, 5, 10, 15]

// Set nested array component data
Character.skills[eid] = [
    [1, 5.0, 100.5],  // Skill 1: level 5, 100.5 exp
    [2, 3.0, 50.2],   // Skill 2: level 3, 50.2 exp
    [3, 7.0, 200.8]   // Skill 3: level 7, 200.8 exp
]

// Serialize component data for entity
const buffer = serialize([eid])

// Zero out components to prepare for deserialization
Character.position[eid] = null
Character.inventory[eid] = []
Character.skills[eid] = []

// Deserialize back into components
deserialize(buffer)

// Assert all component data was deserialized correctly
console.assert(JSON.stringify(Character.position[eid]) == JSON.stringify([10.5, 20.4]))
console.assert(JSON.stringify(Character.inventory[eid]) == JSON.stringify([1, 5, 10, 15]))
console.assert(JSON.stringify(Character.skills[eid]) == JSON.stringify([
    [1, 5.0, 100.5],
    [2, 3.0, 50.2],
    [3, 7.0, 200.8]
]))
```
## Observer Serialization 

The Observer serializer tracks entity additions/removals and component additions/removals on entities. Unlike SoA serializers, observer serializers do depend on `bitECS`. For full network state synchronization, use it together with the SoA serializer:

1. Observer serializer will track and send entities and components that are added/removed
2. SoA serializer sends the actual component data

This combination efficiently handles both entity/component presence and data synchronization across the network.

Key functions:
- `createObserverSerializer(world, networkTag, components)`
- `createObserverDeserializer(world, networkTag, components)`

The `networkTag` parameter is a component that marks entities for serialization. Only entities with this tag will be included in serialization.

The `components` parameter is an array of components that will be tracked for addition and removal. When a component in this array is added to or removed from an entity with the network tag, it will be included in the serialized data.

```ts
import { addComponent, removeComponent, hasComponent, addEntity, createWorld } from 'bitecs'
import { createObserverSerializer, createObserverDeserializer } from 'bitecs/serialization'

const world = createWorld()
const eid = addEntity(world)

const Position = { x: [] as number[], y: [] as number[] }
const Health = [] as number[]
const Networked = {}

// Create serializers
const serializer = createObserverSerializer(world, Networked, [Position, Health])
const deserializer = createObserverDeserializer(world, Networked, [Position, Health])

// Add some components
addComponent(world, eid, Networked)
addComponent(world, eid, Position)
addComponent(world, eid, Health)

// Serialize changes
const buffer = serializer()

// Reset the state
removeComponent(world, eid, Position)
removeComponent(world, eid, Health)

// Deserialize changes back
deserializer(buffer)

// Verify components were restored
console.assert(hasComponent(world, eid, Position))
console.assert(hasComponent(world, eid, Health))
```

## Snapshot Serialization

The Snapshot serializer captures the complete state of entities and components at a point in time. This is useful for:

- Full state synchronization over the network
- Save game states
- Debugging/replay systems

Key functions:
- `createSnapshotSerializer(world, components)` - Creates a full state serializer
- `createSnapshotDeserializer(world, components)` - Creates a full state deserializer

```ts
import { createWorld, addEntity, addComponent, removeEntity, hasComponent } from 'bitecs'
import { createSnapshotSerializer, createSnapshotDeserializer, f32, u8 } from 'bitecs/serialization'

// Example using Snapshot serializer for full state capture
const world = createWorld()
const eid = addEntity(world)

// Define components with tagged SoA data storage
const Position = { x: f32([]), y: f32([]) }
const Health = u8([])

// Create serializers
const serialize = createSnapshotSerializer(world, [Position, Health])
const deserialize = createSnapshotDeserializer(world, [Position, Health])

// Set up initial state
addComponent(world, eid, Position)
Position.x[eid] = 10
Position.y[eid] = 20

addComponent(world, eid, Health)
Health[eid] = 100

// Serialize full state
const buffer = serialize()

// Clear world state
removeEntity(world, eid)
Position.x[eid] = 0
Position.y[eid] = 0
Health[eid] = 0

// Deserialize state back
deserialize(buffer)

// Verify state was restored
console.assert(hasComponent(world, eid, Position))
console.assert(hasComponent(world, eid, Health))
console.assert(Position.x[eid] === 10)
console.assert(Position.y[eid] === 20)
console.assert(Health[eid] === 100)
```
