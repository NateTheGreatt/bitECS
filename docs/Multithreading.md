
# Multithreading

When dealing with large numbers of entities or intensive calculations, worker threads can be utilized for parallel processing. While `bitECS` does not provide an explicit multithreading API, its data structures are designed to work efficiently with worker threads.

The `asBuffer` query modifier can be used to return a `Uint32Array` instead of a `readonly EntityId[]`, making it ideal for multithreaded operations. `Uint32Array` is backed by a `SharedArrayBuffer` (SAB) and can be efficiently shared between threads or copied as raw data, enabling parallel processing of query results across different execution contexts.

```ts
const entities = query(world, [Position, Mass], asBuffer); // Returns SAB-backed Uint32Array
```

This can be combined with component SoA stores made of TypedArrays backed by `SharedArrayBuffer`. This allows both query results and component data to be efficiently shared between threads

The ECS API functions like `addEntity`, `removeEntity`, `addComponent`, etc. cannot be used directly in worker threads since they modify shared state and require synchronization. However, you can pretty easily create custom message queues to send these commands back to the main thread for processing:

```ts
// Create world and components
const MAX_ENTS = 1e6
const world = createWorld({
    // SAB-backed components
    components: {
        Position: {
            x: new Float32Array(new SharedArrayBuffer(MAX_ENTS * Float32Array.BYTES_PER_ELEMENT)),
            y: new Float32Array(new SharedArrayBuffer(MAX_ENTS * Float32Array.BYTES_PER_ELEMENT))
        }
    }
})

// Create worker thread
const worker = new Worker('./worker.js')

// Send SAB-backed data to worker
worker.postMessage({
    entities: query(world, [world.components.Position], asBuffer),
    components: world.components
})

// ==========================================
// Inside worker thread (worker.js):
// ==========================================

// Global command queues
const MAX_CMDS = 1e6
const removeQueue = new Uint32Array(new SharedArrayBuffer(MAX_CMDS * Uint32Array.BYTES_PER_ELEMENT))

self.onmessage = ({ data }) => {
    const { 
        entities,
        components: { Position }
    } = data

    let removeCount = 0

    for (let i = 0; i < entities.length; i++) {
        const eid = entities[i]
        Position.x[eid] += 1
        Position.y[eid] += 1
        
        removeQueue[removeCount++] = eid
    }

    // Send queue back to main thread
    self.postMessage({
        removeQueue: removeQueue.subarray(0, removeCount)
    })
}

// ==========================================
// Back on main thread:
// ==========================================

// Process queues after worker is done
worker.on('message', ({ removeQueue }) => {
    for (let i = 0; i < removeQueue.length; i++) {
        const eid = removeQueue[i]
        removeEntity(world, eid)
    }
})
```

A common lockless multithreading pattern is to split query results across multiple worker threads. Each thread processes a subset of the entities in parallel by running the same system logic. This approach maximizes performance through parallel processing, but requires careful consideration - you must ensure threads don't write to entity data that other threads might be reading simultaneously to avoid race conditions. As long as threads operate on independent data, this pattern enables significant performance gains through parallel execution.

```ts
// Example of splitting query results across multiple workers

// Create workers
const WORKER_COUNT = 4
const workers = Array(WORKER_COUNT)
    .fill(null)
    .map(() => new Worker('worker.js'))

// Process queues after all workers complete
let completedWorkers = 0
workers.forEach(worker => worker.on('message', () => {
    completedWorkers++
    if (completedWorkers === WORKER_COUNT) {
        processQueues()
        completedWorkers = 0
    }
}))
// Query entities and split results 
function processEntitiesParallel(world) {
    const entities = query(world, [world.components.Position])
    const partitionSize = Math.ceil(entities.length / WORKER_COUNT)
    // Split entities into partitions for each worker
    for (let i = 0; i < WORKER_COUNT; i++) {
        const start = i * partitionSize
        const end = Math.min(start + partitionSize, entities.length)
        const partition = entities.subarray(start, end)
        
        // Send partition to worker
        workers[i].postMessage({
            entities: partition,
            components: world.components
        })
    }
}

// Example usage
processEntitiesParallel(world)
```