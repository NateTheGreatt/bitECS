import {
    addComponent,
    removeComponent,
    addEntity,
    observe,
    onAdd,
    onRemove,
    World,
} from '../core'

/**
 * Creates a serializer for observing and serializing changes in networked entities.
 * @param {World} world - The ECS world object.
 * @param {any} networkedTag - The component used to tag networked entities.
 * @param {any[]} components - An array of components to observe for changes.
 * @param {ArrayBuffer} [buffer=new ArrayBuffer(1024 * 1024 * 100)] - The buffer to use for serialization.
 * @returns {Function} A function that, when called, serializes the queued changes and returns a slice of the buffer.
 */
export const createObserverSerializer = (world: World, networkedTag: any, components: any[], buffer = new ArrayBuffer(1024 * 1024 * 100)) => {
    const dataView = new DataView(buffer)
    let offset = 0
    const queue: [number, number, number][] = []

    components.forEach((component, i) => {
        observe(world, onAdd(networkedTag, component), (eid: number) => {
            queue.push([eid, 0, i])
        })

        observe(world, onRemove(networkedTag, component), (eid: number) => {
            queue.push([eid, 1, i])
        })
    })

    return () => {
        offset = 0
        
        for (let i = 0; i < queue.length; i++) {
            const [entityId, type, componentId] = queue[i]
            dataView.setUint32(offset, entityId)
            offset += 4
            dataView.setUint8(offset, type)
            offset += 1
            dataView.setUint8(offset, componentId)
            offset += 1
        }
        queue.length = 0

        return buffer.slice(0, offset)
    }
}

/**
 * Creates a deserializer for applying serialized changes to a world.
 * @param {World} world - The ECS world object.
 * @param {any} networkedTag - The component used to tag networked entities.
 * @param {any[]} components - An array of components that can be added or removed.
 * @returns {Function} A function that takes a serialized packet and an optional entity ID mapping, and applies the changes to the world.
 */
export const createObserverDeserializer = (world: World, networkedTag: any, components: any[]) => {
    return (packet: ArrayBuffer, entityIdMapping: Map<number, number> = new Map()) => {
        const dataView = new DataView(packet)
        let offset = 0

        while (offset < packet.byteLength) {
            const packetEntityId = dataView.getUint32(offset)
            offset += 4
            const operationType = dataView.getUint8(offset)
            offset += 1
            const componentId = dataView.getUint8(offset)
            offset += 1

            const component = components[componentId]

            let worldEntityId = entityIdMapping.get(packetEntityId)
            if (worldEntityId === undefined) {
                worldEntityId = addEntity(world)
                entityIdMapping.set(packetEntityId, worldEntityId)
            }

            if (operationType === 0) {
                addComponent(world, component, worldEntityId)
                addComponent(world, networkedTag, worldEntityId)
            } else if (operationType === 1) {
                removeComponent(world, component, worldEntityId)
            }
        }

        return entityIdMapping
    }
}
