import bitECS from '../../src/bitECS.js'
import pixiRenderer from '../common/pixiRenderer.js'
import registerComponents from '../common/components.js'
import moveSystem2d from '../common/move2d.js'

const n = 25000,
    width = 800,
    height = 600

const ecs = bitECS(n)
const {
    addEntity,
    addComponent,
    registerSystem,
    update
} = ecs

// patch ecs with generic components/systems
registerComponents(ecs)
moveSystem2d(ecs, width, height)
pixiRenderer(ecs, width, height)

// create new mouseForce system
let mousePos = {x:0,y:0}
document.addEventListener('mousemove', e => {
    mousePos.x = e.clientX
    mousePos.y = e.clientY
})

registerSystem({
    name: 'mouseForce',
    components: ['position','velocity'],
    update: (p,v) => eid => {
        let threshold = 50
        let xx = mousePos.x - p.x[eid] 
        let yy = mousePos.y - p.y[eid]
        let dist = Math.sqrt(Math.pow(xx,2) + Math.pow(yy,2))

        if(dist < threshold) {
            v.x[eid] -= (xx/dist)/2
            v.y[eid] -= (yy/dist)/2
        }
    }
})


const rndRange = (min,max) => Math.random() * (max - min) + min

for(let i = 0; i < n; i++) {
    let eid = addEntity()

    addComponent('position', eid, {x: rndRange(0,width), y: rndRange(0,height)})
    addComponent('velocity', eid, {x: rndRange(-1,1), y: rndRange(-1,1), max: 2})

    let w = 1
    let h = w
    addComponent('size', eid, { w, h })

    addComponent('visible', eid)
}

const loop = () => {
    update()
    requestAnimationFrame(loop)
}

loop()