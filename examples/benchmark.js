import Timer from '../src/Timer.js'
import bitECS from '../src/bitECS.js'

const timer = Timer()

timer.start()

const n = 1000000

const {
    entities,
    addEntity,
    addComponent,
    registerComponent,
    registerSystem,
    update
} = bitECS(n)

const Vector3 = { x: 'float32', y: 'float32', z: 'float32' }
registerComponent('position', Vector3)
registerComponent('velocity', Vector3)

let x = 0
registerSystem({
    name: 'movement', 
    components: ['position', 'velocity'], 
    update: (pos, vel) => eid => {
        pos.x[eid] += vel.x[eid]
        pos.y[eid] += vel.y[eid]
        pos.z[eid] += vel.z[eid]
        x++
    }
})

for(let i = 0; i < n; i++) {
    let eid = addEntity()
    addComponent('position', eid, {x: Math.random(), y: Math.random()})
    addComponent('velocity', eid, {x: Math.random(), y: Math.random()})
}

timer.check('setup')

update()

timer.check('update')

console.log(x, 'entities processed')