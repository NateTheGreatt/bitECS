import { createWorld, addEntity, addComponent, removeEntity, query } from 'bitecs'
import { createSnapshotSerializer, createObserverSerializer, createSoASerializer } from 'bitecs/serialization'
import { components, Position, Health, Networked, MESSAGE_TYPES } from './shared'

// Create server world
const world = createWorld()

// Create serializers
const snapshotSerializer = createSnapshotSerializer(world, components)
const observerSerializer = createObserverSerializer(world, Networked, components)
const soaSerializer = createSoASerializer(components)

// Helper to tag message with type
const tagMessage = (type: number, data: ArrayBuffer) => {
    const tagged = new Uint8Array(data.byteLength + 1)
    tagged[0] = type
    tagged.set(new Uint8Array(data), 1)
    return tagged.buffer
}

const createNetworkedEntity = () => {
    // Create new player entity for this client
    const entity = addEntity(world)
    addComponent(world, entity, Position)
    addComponent(world, entity, Health)
    addComponent(world, entity, Networked)

    Position.x[entity] = Math.random() * 400
    Position.y[entity] = Math.random() * 400
    Health.value[entity] = 100
    return entity
}

createNetworkedEntity()

const playerEntities = new Map()

// Setup WebSocket server
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

            // Send initial snapshot when client first connects
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

            // update the client with any newly created entities (like players, enemies, etc)
            const updates = observerSerializer()
            if (updates.byteLength > 0) {
                console.log('Sending OBSERVER update')
                ws.send(tagMessage(MESSAGE_TYPES.OBSERVER, updates))
            }

            // update the client with the position data of all networked entities
            const soaUpdates = soaSerializer(query(world, [Networked, Position]))
            console.log('Sending SOA update')
            ws.send(tagMessage(MESSAGE_TYPES.SOA, soaUpdates))
        }
    }
})

console.log(`WebSocket server running on ${server.hostname}:${server.port}`)