# bitECS 0.4.0 Release Notes

## Overview

Version 0.4.0 is a **complete rewrite in TypeScript** with new features and capabilities.

### What's New at a Glance

🔗 **Relationships** - Create complex entity hierarchies and connections with data  
🏗️ **Prefabs** - Reusable entity templates with inheritance  
🔍 **Advanced Queries** - Hierarchical queries, wildcards, and complex operators  
👀 **Observers** - React to component changes with hooks and custom logic  
📦 **Multiple Modules** - Core, serialization, and legacy compatibility  
⚡ **TypeScript First** - Built from the ground up with TypeScript

## 🗑️ Removed Features

The following features have been removed in 0.4.0 (available in `bitecs/legacy` for incremental migrations):

- **Types System** (`Types.f32`, `Types.eid`, etc.)
- **defineComponent()** - Components are now plain objects
- **defineQuery()** - Use `query()` function directly
- **enterQuery/exitQuery** - Use observers with `onAdd`/`onRemove`
- **Changed() Queries** - Use observers or manual dirty flags
- **queryBuffer()** - Use `query()` with `asBuffer` modifier
- **queryNested()** - Use `query()` with `isNested` modifier
- **Serialization API** - Redesigned and moved to `bitecs/serialization` module

See [migration guide](docs/MIGRATION_GUIDE_0.4.0.md) for upgrade steps.

## ✨ Major New Features

### 🔗 Relationships & Relations
Create complex entity relationships with optional data storage:
```ts
const ChildOf = createRelation(withAutoRemoveSubject)
const Contains = createRelation(withStore((targetEid) => ({ amount: [] })))

// Use in hierarchical queries
const entities = query(world, [Position, Hierarchy(ChildOf)])
```

### 🏗️ Prefabs & Inheritance
Reusable entity templates with automatic inheritance:
```ts
const Animal = addPrefab(world)
const sheep = addEntity(world)
addComponent(world, sheep, IsA(Animal)) // Inherits Animal components
```

### 🔍 Advanced Query System
- Query operators: `And`, `Or`, `Not`, `All`, `Any`, `None`
- Hierarchical queries with `Hierarchy()` term (topological order)
- Query modifiers: `asBuffer` (Uint32Array), `isNested` (safe iteration)
- Options object or modifier syntax

```ts
// Basic and operator queries
const entities = query(world, [Position, Velocity])
const tagged = query(world, [Position, Not(Velocity)])

// With modifiers (new syntax)
const buffered = query(world, [Position], asBuffer)          // Returns Uint32Array
const nested = query(world, [Position], isNested)           // Safe iteration
const both = query(world, [Position], asBuffer, isNested)   // Combined

// Options object (alternative)
const entities = query(world, [Position], { buffered: true, commit: false })

// Hierarchical queries
const ordered = query(world, [Position, Hierarchy(ChildOf)])      // Parents before children
const depth2 = query(world, [Position, Hierarchy(ChildOf, 2)])   // Specific depth

```

### 👀 Observer System
React to component changes with hooks:
```ts
observe(world, onAdd(Position, Velocity), (eid) => { /* moving entity added */ })
observe(world, onSet(Position), (eid, data) => { /* setComponent called */ })
```

### 🆔 Entity Management
- Manual entity recycling with deferred removal
- Entity ID versioning to prevent collision issues  
- Shared entity indexes across multiple worlds

### 🌍 Enhanced World Creation
Backward compatible with new optional capabilities:
```ts
const world = createWorld()                             // Same as before
const world = createWorld({ myData: 'custom' })        // Custom contexts
const world = createWorld(createEntityIndex())         // Shared entity indexes
```

## 💔 Breaking Changes

### Component Definition
```ts
// Before: defineComponent({ x: Types.f32, y: Types.f32 })
// After: Plain objects
const Position = { x: [] as number[], y: [] as number[] }
```

### addComponent Parameter Order
```ts
// Before: addComponent(world, component, eid)
addComponent(world, Position, eid)

// After: addComponent(world, eid, component)
addComponent(world, eid, Position)
```

### Queries
```ts
// Before: defineQuery([Position, Velocity]) + movementQuery(world)
const movementQuery = defineQuery([Position, Velocity])
const entities = movementQuery(world)

// After: Direct function calls
const entities = query(world, [Position, Velocity])
```

### Enter/Exit Queries → Flexible Observers
```ts
// Before: Limited enter/exit functions
const enteredMovementQuery = enterQuery(movementQuery)
const exitedMovementQuery = exitQuery(movementQuery)

// After: Powerful reactive observers with custom logic
observe(world, onAdd(Position, Velocity), (eid) => { 
  // Custom logic for each entity that starts moving
  console.log(`Entity ${eid} started moving!`)
})

// Or recreate enter/exit behavior by adding to queues
world.enteredMovers = []
world.exitedMovers = []
observe(world, onAdd(Position, Velocity), (eid) => world.enteredMovers.push(eid))
observe(world, onRemove(Position, Velocity), (eid) => world.exitedMovers.push(eid))
```

### Changed() Queries → Precise Change Tracking
```ts
// Before: Automatic change detection with expensive diffing
const changedPositionQuery = defineQuery([Changed(Position)])
Position.x[eid]++  // Automatically detected (performance cost)

// After: Manual change tracking via set()/setComponent() + precise observers
observe(world, onSet(Position), (eid, params) => { 
  Position[eid] = params  // Custom data storage
  console.log(`Position changed for entity ${eid}:`, params)
})

addComponent(world, eid, set(Position, { x: 100, y: 200 }))  // Triggers onSet
setComponent(world, eid, Position, { x: 100, y: 200 })       // Alternative trigger
```

## 📋 Migrating from 0.3.x

**[→ Full Migration Guide](https://github.com/NateTheGreatt/bitECS/blob/main/docs/MIGRATION_GUIDE_0.4.0.md)**

## 📦 Available Modules

- **Core** (`bitecs`): New flexible ECS toolkit  
- **Serialization** (`bitecs/serialization`): Serialization utilities
- **Legacy** (`bitecs/legacy`): Backward compatibility with 0.3.x API

---
