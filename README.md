# 👾 bitECS 👾

Tiny, data-driven, high performance [ECS](https://en.wikipedia.org/wiki/Entity_component_system) library written using JavaScript TypedArrays.

## Features
- `<3kb` gzipped
- zero dependencies
- node or browser
- [_fast_](https://github.com/NateTheGreatt/bitECS/blob/master/examples/benchmark.js)

## Install
```
npm i bitecs
```

## Example
```javascript
// imports a factory function
import bitECS from 'bitECS'

// define the max number of entities in the ecs
const n = 1000000

// create a new ECS and destruct desirable functions
const {
    addEntity,
    addComponent,
    removeComponent,
    registerComponent,
    registerSystem,
    update
} = bitECS(n)

// register components
const Vector3 = { x: 'float32', y: 'float32', z: 'float32' } // nested structures are fully supported
registerComponent('position', Vector3)
registerComponent('velocity', Vector3)

// register a movement system
registerSystem({
    name: 'movement', 
    // update will only apply to these components
    // in this case entities with both a position & velocity component will be processed
    components: ['position', 'velocity'], 
    // update function provides component managers and the entity ID to do work on
    update: (pos, vel) => eid => {
        // entity data is obtained from the respective component managers
        // managers are objects with typedarray properties
        // this is how high performance is reaped and maintained
        pos.x[eid] += vel.x[eid]
        pos.y[eid] += vel.y[eid]
        pos.z[eid] += vel.z[eid]
    },
    // called whenever an entity is added to the system (has required components)
    onEnter: (pos, vel) => eid => {},
    // called whenever an entity is removed from the system (no longer has required components)
    onExit: (pos, vel) => eid => {},
    // called once, before the system update (not per entity, no eid passed in)
    onBefore: (pos, vel) => {},
    // called once, after the system update
    onAfter: (pos, vel) => {},
    // called per entity, before the system updates it
    onBeforeEach: (pos, vel) => eid => {},
    // called per entity, after the system updates it
    onAfterEach: (pos, vel) => eid => {}
})


// create n entities with random position and velocity
for(let i = 0; i < n; i++) {
    let eid = addEntity()
    addComponent('position', eid, {x: Math.random(), y: Math.random(), z: Math.random()})
    addComponent('velocity', eid, {x: Math.random(), y: Math.random(), z: Math.random()})
}

// node
setInterval(() => {
    update()
}, 16) // yes, this ECS can process one million entities in under 16ms (depending on the CPU)

// browser
const loop = () => {
    requestAnimationFrame(loop)
    update()
}
loop()
```