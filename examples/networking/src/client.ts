import { createWorld, addEntity, query } from '../../../src/core'
import { createSnapshotDeserializer, createObserverDeserializer, createSoADeserializer } from '../../../src/serialization'
import { components, Position, Health, Networked, MESSAGE_TYPES } from './shared'

// Create client world
const world = createWorld()

// Create deserializers
const snapshotDeserializer = createSnapshotDeserializer(world, components)
const observerDeserializer = createObserverDeserializer(world, Networked, components)
const soaDeserializer = createSoADeserializer(components)

// Connect to server using Bun WebSocket client
const socket = new WebSocket("ws://localhost:5001")

socket.addEventListener("open", () => {
    console.log("Connected to server")
})

const idMap = new Map()
socket.addEventListener("message", async ({data}) => {
    const arrayBuffer = data.buffer
    
    const messageView = new Uint8Array(arrayBuffer)
    const type = messageView[0]
    
    // Get payload by creating new array with remaining data
    const payload = messageView.slice(1).buffer as ArrayBuffer

    switch (type) {
        case MESSAGE_TYPES.SNAPSHOT:
            console.log('Received SNAPSHOT message')
            snapshotDeserializer(payload, idMap)
            break
        case MESSAGE_TYPES.OBSERVER:
            console.log('Received OBSERVER message')
            observerDeserializer(payload, idMap)
            break
        case MESSAGE_TYPES.SOA:
            console.log('Received SOA message')
            soaDeserializer(payload, idMap)
            break
    }

    query(world, [Position]).forEach(eid => {
        console.log(`Entity ${eid} position: (${Position.x[eid].toFixed(2)}, ${Position.y[eid].toFixed(2)})`)
    })
})

socket.addEventListener("close", () => {
    console.log("Disconnected from server")
})

socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error)
})

const sendMessage = () => {
    if (socket.readyState === WebSocket.OPEN) {
        console.log('Sending empty message to server')
        const message = new ArrayBuffer(0)
        socket.send(message)
    }
}

setInterval(() => {
    sendMessage()
}, 2500)
