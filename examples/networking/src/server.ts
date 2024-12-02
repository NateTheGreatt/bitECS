import { createWorld, addEntity, addComponent, removeEntity, query } from 'bitecs'
import { createSnapshotSerializer, createObserverSerializer, createSoASerializer } from 'bitecs/serialization'
import { components, Position, Health, Networked, MESSAGE_TYPES } from './shared'

const world = createWorld()

const snapshotSerializer = createSnapshotSerializer(world, components)
const observerSerializer = createObserverSerializer(world, Networked, components)
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

            // Initial state sync
            const snapshot = snapshotSerializer()
            ws.send(tagMessage(MESSAGE_TYPES.SNAPSHOT, snapshot))
        },
        close(ws) {
            console.log('Client disconnected')
            const playerEntity = playerEntities.get(ws)
            removeEntity(world, playerEntity)
            playerEntities.delete(ws)
        },
        message(ws, message) {
            const playerEntity = playerEntities.get(ws)
            console.log('Received message from client from', playerEntity)
            
            Position.x[playerEntity] += 1

            // Sync any new entities
            const updates = observerSerializer()
            if (updates.byteLength > 0) {
                console.log('Sending OBSERVER update')
                ws.send(tagMessage(MESSAGE_TYPES.OBSERVER, updates))
            }

            // Sync latest positions
            const soaUpdates = soaSerializer(query(world, [Networked, Position]))
            console.log('Sending SOA update')
            ws.send(tagMessage(MESSAGE_TYPES.SOA, soaUpdates))
        }
    }
})

console.log(`WebSocket server running on ${server.hostname}:${server.port}`)