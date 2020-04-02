# 👾 bitECS 👾

Tiny, data-driven, high performance ECS library written in Javascript.

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
const Vector3 = { x: 'float32', y: 'float32', z: 'float32' }
registerComponent('position', Vector3)
registerComponent('velocity', Vector3)

// register a movement system
registerSystem({
    name: 'movement', 
    // only applies to entities with position & velocity components
    components: ['position', 'velocity'], 
    // update function provides component managers and the entity ID to do work on
    update: (pos, vel) => eid => {
        // entity data is obtained from the respective component managers, which are objects with typedarray properties
        // this is how high performance is reaped and maintained
        pos.x[eid] += vel.x[eid]
        pos.y[eid] += vel.y[eid]
        pos.z[eid] += vel.z[eid]
    },
    onEnter: (pos, vel) => eid => {}, // optional
    onExit: (pos, vel) => eid => {} // optional
})


// create n entities with random position and velocity
for(let i = 0; i < n; i++) {
    let eid = addEntity()
    addComponent('position', eid, {x: Math.random(), y: Math.random()})
    addComponent('velocity', eid, {x: Math.random(), y: Math.random()})
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
