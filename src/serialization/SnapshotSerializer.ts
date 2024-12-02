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
    ComponentRef,
    query
} from '../core'
import { $u8, $i8, $u16, $i16, $u32, $i32, $f32 } from './SoASerializer'
query
/**
 * Serializes relation data for a specific entity
 */
function serializeRelationData(data: any, eid: number, dataView: DataView, offset: number) {
    if (!data) return offset
    
    // Handle array data (AoS) - defaults to f64
    if (Array.isArray(data)) {
        const value = data[eid]
        if (value !== undefined) {
            dataView.setFloat64(offset, value)
            return offset + 8
        }
        return offset
    }
    
    // Handle object data (SoA)
    if (typeof data === 'object') {
        const keys = Object.keys(data).sort()
        for (const key of keys) {
            const arr = data[key]
            const value = arr[eid]
            
            if (value !== undefined) {
                if (arr instanceof Int8Array || $i8 in arr) {
                    dataView.setInt8(offset, value)
                    offset += 1
                } else if (arr instanceof Uint8Array || $u8 in arr) {
                    dataView.setUint8(offset, value)
                    offset += 1
                } else if (arr instanceof Int16Array || $i16 in arr) {
                    dataView.setInt16(offset, value)
                    offset += 2
                } else if (arr instanceof Uint16Array || $u16 in arr) {
                    dataView.setUint16(offset, value)
                    offset += 2
                } else if (arr instanceof Int32Array || $i32 in arr) {
                    dataView.setInt32(offset, value)
                    offset += 4
                } else if (arr instanceof Uint32Array || $u32 in arr) {
                    dataView.setUint32(offset, value)
                    offset += 4
                } else if (arr instanceof Float32Array || $f32 in arr) {
                    dataView.setFloat32(offset, value)
                    offset += 4
                } else {
                    // Default to f64
                    dataView.setFloat64(offset, value)
                    offset += 8
                }
            }
        }
    }
    
    return offset
}

/**
 * Deserializes relation data for a specific entity
 */
function deserializeRelationData(data: any, eid: number, dataView: DataView, offset: number) {
    if (!data) return offset
    
    // Handle array data (AoS) - defaults to f64
    if (Array.isArray(data)) {
        data[eid] = dataView.getFloat64(offset)
        return offset + 8
    }
    
    // Handle object data (SoA)
    if (typeof data === 'object') {
        const keys = Object.keys(data).sort()
        for (const key of keys) {
            const arr = data[key]
            
            if (arr instanceof Int8Array || $i8 in arr) {
                arr[eid] = dataView.getInt8(offset)
                offset += 1
            } else if (arr instanceof Uint8Array || $u8 in arr) {
                arr[eid] = dataView.getUint8(offset)
                offset += 1
            } else if (arr instanceof Int16Array || $i16 in arr) {
                arr[eid] = dataView.getInt16(offset)
                offset += 2
            } else if (arr instanceof Uint16Array || $u16 in arr) {
                arr[eid] = dataView.getUint16(offset)
                offset += 2
            } else if (arr instanceof Int32Array || $i32 in arr) {
                arr[eid] = dataView.getInt32(offset)
                offset += 4
            } else if (arr instanceof Uint32Array || $u32 in arr) {
                arr[eid] = dataView.getUint32(offset)
                offset += 4
            } else if (arr instanceof Float32Array || $f32 in arr) {
                arr[eid] = dataView.getFloat32(offset)
                offset += 4
            } else {
                // Default to f64
                arr[eid] = dataView.getFloat64(offset)
                offset += 8
            }
        }
    }
    
    return offset
}

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
                        const relationData = (component as any)(target)
                        offset = serializeRelationData(relationData, entityId, dataView, offset)
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
export const createSnapshotDeserializer = (world: World, components: (Record<string, PrimitiveBrand> | ComponentRef)[], constructorMapping?: Map<number, number>) => {
    let entityIdMapping = constructorMapping || new Map<number, number>()
    const soaDeserializer = createSoADeserializer(components)

    return (packet: ArrayBuffer, overrideMapping?: Map<number, number>): Map<number, number> => {
        const currentMapping = overrideMapping || entityIdMapping
        const dataView = new DataView(packet)
        let offset = 0

        // Read entity count
        const entityCount = dataView.getUint32(offset)
        offset += 4

        // Deserialize entity-component relationships
        for (let entityIndex = 0; entityIndex < entityCount; entityIndex++) {
            const packetEntityId = dataView.getUint32(offset)
            offset += 4

            let worldEntityId = currentMapping.get(packetEntityId)
            if (worldEntityId === undefined) {
                worldEntityId = addEntity(world)
                currentMapping.set(packetEntityId, worldEntityId)
            }

            const componentCount = dataView.getUint8(offset)
            offset += 1

            for (let i = 0; i < componentCount; i++) {
                const componentIndex = dataView.getUint8(offset)
                offset += 1
                const component = components[componentIndex]
                
                if (isRelation(component)) {
                    const targetId = dataView.getUint32(offset)
                    offset += 4
                    let worldTargetId = currentMapping.get(targetId)
                    if (worldTargetId === undefined) {
                        worldTargetId = addEntity(world)
                        currentMapping.set(targetId, worldTargetId)
                    }
                    const relationComponent = (component as (target: any) => any)(worldTargetId)
                    addComponent(world, worldEntityId, relationComponent)
                    offset = deserializeRelationData(relationComponent, worldEntityId, dataView, offset)
                } else {
                    addComponent(world, worldEntityId, component)
                }
            }
        }

        // Deserialize component data
        soaDeserializer(packet.slice(offset), currentMapping)

        return currentMapping
    }
}


export const test = (w:any) => {
    return w === Wildcard
}