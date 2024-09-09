import { addComponent, removeComponent } from '../core/Component'
import { addEntity, removeEntity } from '../core/Entity'
import { observe, onAdd, onRemove } from '../core/Query'
import { World, ComponentRef, entityExists } from '../core/index'
import { EntityId } from '../core/Entity'

enum OperationType {
    AddEntity = 0,
    RemoveEntity = 1,
    AddComponent = 2,
    RemoveComponent = 3
}

/**
 * Creates a serializer for observing and serializing changes in networked entities.
 * @param {World} world - The ECS world object.
 * @param {any} networkedTag - The component used to tag networked entities.
 * @param {any[]} components - An array of components to observe for changes.
 * @param {ArrayBuffer} [buffer=new ArrayBuffer(1024 * 1024 * 100)] - The buffer to use for serialization.
 * @returns {Function} A function that, when called, serializes the queued changes and returns a slice of the buffer.
 */
export const createObserverSerializer = (world: World, networkedTag: ComponentRef, components: ComponentRef[], buffer = new ArrayBuffer(1024 * 1024 * 100)) => {
    const dataView = new DataView(buffer)
    let offset = 0
    const queue: [number, OperationType, number][] = []
    
    observe(world, onAdd(networkedTag), (eid: EntityId) => {
        queue.push([eid, OperationType.AddEntity, -1])
    })

    observe(world, onRemove(networkedTag), (eid: EntityId) => {
        queue.push([eid, OperationType.RemoveEntity, -1])
    })

    components.forEach((component, i) => {
        observe(world, onAdd(networkedTag, component), (eid: EntityId) => {
            queue.push([eid, OperationType.AddComponent, i])
        })

        observe(world, onRemove(networkedTag, component), (eid: EntityId) => {
            queue.push([eid, OperationType.RemoveComponent, i])
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
            if (type === OperationType.AddComponent || type === OperationType.RemoveComponent) {
                dataView.setUint8(offset, componentId)
                offset += 1
            }
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
export const createObserverDeserializer = (world: World, networkedTag: ComponentRef, components: ComponentRef[], entityIdMapping: Map<number, number> = new Map()) => {
    return (packet: ArrayBuffer) => {
        const dataView = new DataView(packet)
        let offset = 0

        while (offset < packet.byteLength) {
            const packetEntityId = dataView.getUint32(offset)
            offset += 4
            const operationType = dataView.getUint8(offset)
            offset += 1
            let componentId = -1
            if (operationType === OperationType.AddComponent || operationType === OperationType.RemoveComponent) {
                componentId = dataView.getUint8(offset)
                offset += 1
            }

            const component = components[componentId]
            
            let worldEntityId = entityIdMapping.get(packetEntityId);

            if (operationType === OperationType.AddEntity) {
                if (worldEntityId === undefined) {
                    worldEntityId = addEntity(world);
                    entityIdMapping.set(packetEntityId, worldEntityId);
                    addComponent(world, worldEntityId, networkedTag)
                } else {
                    console.error(`Entity with ID ${packetEntityId} already exists in the mapping.`);
                }
            } else if (worldEntityId !== undefined && entityExists(world, worldEntityId)) {
                if (operationType === OperationType.RemoveEntity) {
                    removeEntity(world, worldEntityId)
                } else if (operationType === OperationType.AddComponent) {
                    addComponent(world, worldEntityId, component)
                } else if (operationType === OperationType.RemoveComponent) {
                    removeComponent(world, worldEntityId, component)
                }
            }
        }

        return entityIdMapping
    }
}
