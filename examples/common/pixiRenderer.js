export default ({ registerSystem }, width, height) => {

    const pixi = new PIXI.Application({ 
        width, 
        height,                       
        antialiasing: true, 
        transparent: false, 
        resolution: 1
    })

    document.body.appendChild(pixi.view)

    const spriteMap = {}

    const addSprite = (eid,w,h) => {
        const sprite = PIXI.Sprite.from(PIXI.Texture.WHITE)
        sprite.width = w
        sprite.height = h
        spriteMap[eid] = sprite
        pixi.stage.addChild(sprite)
    }

    registerSystem({
        name: 'renderer', 
        components: ['position', 'size', 'visible'], 
        update: (p,s) => eid => {
            if(!spriteMap[eid]) addSprite(eid,s.w[eid],s.h[eid])
            spriteMap[eid].x = p.x[eid] - s.w[eid]/2
            spriteMap[eid].y = p.y[eid] - s.h[eid]/2
        }
    })

}