import { UpdateGravityComponents, UpdateGravityInput } from "./updateGravity.common";
const STICKY = 10000;

console.log('worker alive')

function updateGravityWorker(
    { 
        workerEntities, 
        bodyEntities, 
        read: { Position, Mass }, 
        write: { Velocity, Acceleration }
    }: UpdateGravityInput & UpdateGravityComponents
) {
    for (let j = 0; j < workerEntities.length; j++) {
        const meId = workerEntities[j]
        Acceleration.x[meId] = 0;
        Acceleration.y[meId] = 0;
        
        for (let i = 0; i < bodyEntities.length; i++) {
            const currentId = bodyEntities[i];
            if (meId === currentId) continue; // Skip self
            
            const dx = +Position.x[currentId] - +Position.x[meId];
            const dy = +Position.y[currentId] - +Position.y[meId];
            let distanceSquared = dx * dx + dy * dy;
            
            if (distanceSquared < STICKY) distanceSquared = STICKY; // Apply stickiness
            
            const distance = Math.sqrt(distanceSquared);
            const forceMagnitude =
                (+Mass.value[meId] * +Mass.value[currentId]) / distanceSquared;
            
            Acceleration.x[meId] += (dx / distance) * forceMagnitude;
            Acceleration.y[meId] += (dy / distance) * forceMagnitude;
        }

        Velocity.x[meId] += Acceleration.x[meId] / +Mass.value[meId];
        Velocity.y[meId] += Acceleration.y[meId] / +Mass.value[meId];

    }
}

let components: UpdateGravityComponents

onmessage = (event: MessageEvent<UpdateGravityComponents | UpdateGravityInput>) => {
    if ('read' in event.data && 'write' in event.data) {
        components = event.data as UpdateGravityComponents
        postMessage('init-done')
    } else {
        const data = event.data as UpdateGravityInput
        updateGravityWorker({...data, ...components})
        postMessage('system-done')
    }
};
