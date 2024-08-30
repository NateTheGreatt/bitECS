import { createSoASerializer, createSoADeserializer, PrimitiveBrand } from './SoASerializer'
import {
    addComponent,
    hasComponent,
    World,
    getAllEntities,
    addEntity,
} from '../core'

export const createSnapshotSerializer = (world: World, components: Record<string, PrimitiveBrand>[], buffer: ArrayBuffer = new ArrayBuffer(1024 * 1024 * 100)) => {
    const dataView = new DataView(buffer)
    let offset = 0

    const serializeEntityComponentRelationships = (entities: number[]) => {
        const entityCount = entities.length
        
        // Write entity count
        dataView.setUint32(offset, entityCount)
        offset += 4

        // Serialize entity-component relationships
        for (let i = 0; i < entityCount; i++) {
            const entityId = entities[i]
            let componentCount = 0
            
            dataView.setUint32(offset, entityId)
            offset += 4
            
            const componentCountOffset = offset
            offset += 1
            
            for (let j = 0; j < components.length; j++) {
                if (hasComponent(world, components[j], entityId)) {
                    dataView.setUint8(offset, j)
                    offset += 1
                    componentCount++
                }
            }
            
            dataView.setUint8(componentCountOffset, componentCount)
        }
    }

    const serializeComponentData = (entities: number[]) => {
        const soaSerializer = createSoASerializer(components, buffer.slice(offset))
        const componentData = soaSerializer(entities)
        new Uint8Array(buffer).set(new Uint8Array(componentData), offset)
        offset += componentData.byteLength
    }

    return () => {
        offset = 0
        const entities = getAllEntities(world)
        serializeEntityComponentRelationships(entities)
        serializeComponentData(entities)
        return buffer.slice(0, offset)
    }
}

export const createSnapshotDeserializer = (world: World, components: Record<string, PrimitiveBrand>[]) => {
    const soaDeserializer = createSoADeserializer(components)

    return (packet: ArrayBuffer): Map<number, number> => {
        const dataView = new DataView(packet)
        let offset = 0
        const entityIdMap = new Map<number, number>()

        // Read entity count
        const entityCount = dataView.getUint32(offset)
        offset += 4

        // Deserialize entity-component relationships
        for (let entityIndex = 0; entityIndex < entityCount; entityIndex++) {
            const packetEntityId = dataView.getUint32(offset)
            offset += 4

            const worldEntityId = addEntity(world)
            entityIdMap.set(packetEntityId, worldEntityId)

            const componentCount = dataView.getUint8(offset)
            offset += 1

            for (let i = 0; i < componentCount; i++) {
                const componentIndex = dataView.getUint8(offset)
                offset += 1
                addComponent(world, components[componentIndex], worldEntityId)
            }
        }

        // Deserialize component data
        soaDeserializer(packet.slice(offset), entityIdMap)

        return entityIdMap
    }
}

