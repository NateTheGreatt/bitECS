import { createWorld, addEntity, addComponent, removeEntity, query } from 'bitecs'
import { createSnapshotSerializer, createObserverSerializer, createSoASerializer } from 'bitecs/serialization'
import { components, Position, Health, Networked, MESSAGE_TYPES } from './shared'

const world = createWorld()

const snapshotSerializer = createSnapshotSerializer(world, components)
/* Each observer serializer has an internal queue that is cleared when serialized.
 * We need a separate observer per client to track changes independently.
 * This ensures each client gets all changes, since calling serialize() clears the queue.
 * In most cases, we can use a single observer serializer and broadcast the same packet to all clients.
 * However, in this example, we need separate observers per client because:
 * 1. Each client needs to receive all changes since their last update
 * 2. Calling serialize() clears the observer's queue
 * 3. Clients may connect at different times and have different update rates
 * So if we used a single observer, some clients would miss changes that happened between their updates
 */
const observerSerializers = new Map()
const soaSerializer = createSoASerializer(components)

// Needed to differentiate message types on the client
const tagMessage = (type: number, data: ArrayBuffer) => {
    const tagged = new Uint8Array(data.byteLength + 1)
    tagged[0] = type
    tagged.set(new Uint8Array(data), 1)
    return tagged.buffer
}

const createNetworkedEntity = () => {
    const eid = addEntity(world)
    addComponent(world, eid, Position)
    addComponent(world, eid, Health)
    addComponent(world, eid, Networked)

    Position.x[eid] = Math.random() * 400
    Position.y[eid] = Math.random() * 400
    Health[eid] = 100
    return eid
}

createNetworkedEntity()

const playerEntities = new Map()

const server = Bun.serve({
    port: 5001,
    fetch(req, server) {
        if (server.upgrade(req)) {
            return
        }
        return new Response("Upgrade failed", { status: 500 })
    },
    websocket: {
        open(ws) {
            console.log('Client connected')

            playerEntities.set(ws, createNetworkedEntity())
            // Create a new observer serializer for this client
            observerSerializers.set(ws, createObserverSerializer(world, Networked, components))

            // Initial state sync
            const snapshot = snapshotSerializer()
            ws.send(tagMessage(MESSAGE_TYPES.SNAPSHOT, snapshot))
        },
        close(ws) {
            console.log('Client disconnected')
            const playerEntity = playerEntities.get(ws)
            removeEntity(world, playerEntity)
            playerEntities.delete(ws)
            observerSerializers.delete(ws)
        },
        message(ws, message) {
            const playerEntity = playerEntities.get(ws)
            console.log('Received message from client from', playerEntity)
            
            Position.x[playerEntity] += 1

            // Sync latest positions
            const soaUpdates = soaSerializer(query(world, [Networked, Position]))
            console.log('Sending SOA update')
            ws.send(tagMessage(MESSAGE_TYPES.SOA, soaUpdates))

            // Get changes from this client's observer
            const observerSerializer = observerSerializers.get(ws)
            const updates = observerSerializer()
            if (updates.byteLength > 0) {
                console.log('Sending OBSERVER update')
                ws.send(tagMessage(MESSAGE_TYPES.OBSERVER, updates))
            }
        }
    }
})

console.log(`WebSocket server running on ${server.hostname}:${server.port}`)