export default ({registerSystem}, width, height, length) => {
    registerSystem({
        name: 'movement', 
        components: ['position', 'size', 'velocity'], 
        update: (p, s, v) => eid => {

            // clamp velocity
            if(v.x[eid] > v.max[eid]) v.x[eid] = v.max[eid]
            if(v.y[eid] > v.max[eid]) v.y[eid] = v.max[eid]
            if(v.z[eid] > v.max[eid]) v.z[eid] = v.max[eid]

            if(v.x[eid] < -v.max[eid]) v.x[eid] = -v.max[eid]
            if(v.y[eid] < -v.max[eid]) v.y[eid] = -v.max[eid]
            if(v.z[eid] < -v.max[eid]) v.z[eid] = -v.max[eid]

            // add velocity to position
            p.x[eid] += v.x[eid]
            p.y[eid] += v.y[eid]
            p.z[eid] += v.z[eid]

            // boundary collisions
            if(p.x[eid]-(s.w[eid]/2) < 0) { v.x[eid] *= -1; p.x[eid] = s.w[eid]/2; }
            if(p.y[eid]-(s.h[eid]/2) < 0) { v.y[eid] *= -1; p.y[eid] = s.h[eid]/2; }
            if(p.z[eid]-(s.h[eid]/2) < 0) { v.z[eid] *= -1; p.z[eid] = s.l[eid]/2; }

            if(p.x[eid]+(s.w[eid]/2) > width) { v.x[eid] *= -1; p.x[eid] = width-(s.w[eid]/2); }
            if(p.y[eid]+(s.h[eid]/2) > height) { v.y[eid] *= -1; p.y[eid] = height-(s.h[eid]/2); }
            if(p.z[eid]+(s.l[eid]/2) > length) { v.z[eid] *= -1; p.z[eid] = length-(s.l[eid]/2); }

        }
    })
}