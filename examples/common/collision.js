export default ({registerSystem}) => {
    registerSystem({
        name: 'movement', 
        components: ['position', 'size', 'velocity'], 
        update: (p, s, v) => eid => {
    
            entities.forEach((mask,eid2) => {
    
                if(eid == eid2) return
    
                if (
                    p.x[eid] < p.x[eid2] + s.w[eid2]
                &&  p.x[eid] + s.w[eid] > p.x[eid2]
                &&  p.y[eid] < p.y[eid2] + s.h[eid2]
                &&  p.y[eid] + s.h[eid] > p.y[eid2]) {
                    // collision happened
                    // TODO
                }
    
            })
    
        }
    })
}
