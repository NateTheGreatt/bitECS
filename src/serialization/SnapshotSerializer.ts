import { createSoASerializer, createSoADeserializer, PrimitiveBrand } from './SoASerializer'
import {
    addComponent,
    hasComponent,
    World,
    getAllEntities,
    addEntity,
    isRelation,
    getRelationTargets,
    Wildcard,
    Relation,
    ComponentRef
} from 'bitecs'

/**
 * Creates a snapshot serializer for the given world and components.
 * @param {World} world - The ECS world object.
 * @param {Record<string, PrimitiveBrand>[]} components - An array of component definitions.
 * @param {ArrayBuffer} [buffer=new ArrayBuffer(1024 * 1024 * 100)] - The buffer to use for serialization.
 * @returns {Function} A function that, when called, serializes the world state and returns a slice of the buffer.
 */
export const createSnapshotSerializer = (world: World, components: (Record<string, PrimitiveBrand> | ComponentRef)[], buffer: ArrayBuffer = new ArrayBuffer(1024 * 1024 * 100)) => {
    const dataView = new DataView(buffer)
    let offset = 0

    /**
     * Serializes entity-component relationships.
     * @param {number[]} entities - An array of entity IDs.
     */
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
                const component = components[j]
                if (isRelation(component)) {
                    const targets = getRelationTargets(world, entityId, component as Relation<any>)
                    for (const target of targets) {
                        dataView.setUint8(offset, j)
                        offset += 1
                        dataView.setUint32(offset, target)
                        offset += 4
                        componentCount++
                    }
                } else if (hasComponent(world, entityId, component)) {
                    dataView.setUint8(offset, j)
                    offset += 1
                    componentCount++
                }
            }
            
            dataView.setUint8(componentCountOffset, componentCount)
        }
    }

    /**
     * Serializes component data for all entities.
     * @param {number[]} entities - An array of entity IDs.
     */
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

/**
 * Creates a snapshot deserializer for the given world and components.
 * @param {World} world - The ECS world object.
 * @param {Record<string, PrimitiveBrand>[]} components - An array of component definitions.
 * @returns {Function} A function that takes a serialized packet and deserializes it into the world, returning a map of packet entity IDs to world entity IDs.
 */
export const createSnapshotDeserializer = (world: World, components: (Record<string, PrimitiveBrand> | ComponentRef)[]) => {
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
                const component = components[componentIndex]
                
                if (isRelation(component)) {
                    const targetId = dataView.getUint32(offset)
                    offset += 4
                    // We need to wait until all entities are created before adding relations
                    // Store relation info to add later
                    if (!entityIdMap.has(targetId)) {
                        const worldTargetId = addEntity(world)
                        entityIdMap.set(targetId, worldTargetId)
                    }
                    const worldTargetId = entityIdMap.get(targetId)
                    addComponent(world, worldEntityId, (component as (target: any) => any)(worldTargetId))
                } else {
                    addComponent(world, worldEntityId, component)
                }
            }
        }

        // Deserialize component data
        soaDeserializer(packet.slice(offset), entityIdMap)

        return entityIdMap
    }
}
