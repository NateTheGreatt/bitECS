import bitECS from '../../src/bitECS.js'
import threeRenderer from '../common/threeRenderer.js'
import registerComponents from '../common/components.js'
import moveSystem3d from '../common/move3d.js'

const n = 5000,
    width = 500,
    height = 500,
    length = 500

const ecs = bitECS(n)
const {
    addEntity,
    addComponent,
    update
} = ecs

// patch ecs with generic components/systems
registerComponents(ecs)
moveSystem3d(ecs, width, height, length)
const renderer = threeRenderer(ecs, width, height, length)

const rndRange = (min,max) => Math.random() * (max - min) + min

for(let i = 0; i < n; i++) {
    let eid = addEntity()

    addComponent('position', eid, {x: rndRange(0,width), y: rndRange(0,height), z: rndRange(0,length)})
    addComponent('velocity', eid, {x: rndRange(-1,1), y: rndRange(-1,1), z: rndRange(-1,1), max: 1})
    
    let size = rndRange(1,5)
    addComponent('size', eid, { w: size, h: size, l: size })

    addComponent('visible', eid)
}

const loop = () => {
    requestAnimationFrame(loop)
    update()
    renderer.render()
}

loop()