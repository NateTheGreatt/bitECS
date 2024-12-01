import {
    addComponent,
    removeComponent,
    addEntity,
    removeEntity,
    observe,
    onAdd,
    onRemove,
    World,
    ComponentRef,
    entityExists,
    isRelation,
    getRelationTargets,
    Wildcard,
    EntityId
} from 'bitecs'

enum OperationType {
    AddEntity = 0,
    RemoveEntity = 1,
    AddComponent = 2,
    RemoveComponent = 3,
    AddRelation = 4,
    RemoveRelation = 5,
}
import { $u8, $i8, $u16, $i16, $u32, $i32, $f32 } from './SoASerializer'

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
 * Creates a serializer for observing and serializing changes in networked entities.
 */
export const createObserverSerializer = (world: World, networkedTag: ComponentRef, components: ComponentRef[], buffer = new ArrayBuffer(1024 * 1024 * 100)) => {
    const dataView = new DataView(buffer)
    let offset = 0
    const queue: [number, OperationType, number, number?, any?][] = []
    const relationTargets = new Map<number, Map<number, number>>()
    
    observe(world, onAdd(networkedTag), (eid: EntityId) => {
        queue.push([eid, OperationType.AddEntity, -1])
    })

    observe(world, onRemove(networkedTag), (eid: EntityId) => {
        queue.push([eid, OperationType.RemoveEntity, -1])
        relationTargets.delete(eid)
    })

    components.forEach((component, i) => {
        if (isRelation(component)) {
            observe(world, onAdd(networkedTag, component(Wildcard)), (eid: EntityId) => {
                const targets = getRelationTargets(world, eid, component)
                for (const target of targets) {
                    if (!relationTargets.has(eid)) {
                        relationTargets.set(eid, new Map())
                    }
                    relationTargets.get(eid).set(i, target)
                    const relationData = component(target)
                    queue.push([eid, OperationType.AddRelation, i, target, relationData])
                }
            })

            observe(world, onRemove(networkedTag, component(Wildcard)), (eid: EntityId) => {
                const targetMap = relationTargets.get(eid)
                if (targetMap) {
                    const target = targetMap.get(i)
                    if (target !== undefined) {
                        queue.push([eid, OperationType.RemoveRelation, i, target])
                        targetMap.delete(i)
                        if (targetMap.size === 0) {
                            relationTargets.delete(eid)
                        }
                    }
                }
            })
        } else {
            observe(world, onAdd(networkedTag, component), (eid: EntityId) => {
                queue.push([eid, OperationType.AddComponent, i])
            })

            observe(world, onRemove(networkedTag, component), (eid: EntityId) => {
                queue.push([eid, OperationType.RemoveComponent, i])
            })
        }
    })
    
    return () => {
        offset = 0
        
        for (let i = 0; i < queue.length; i++) {
            const [entityId, type, componentId, targetId, relationData] = queue[i]
            dataView.setUint32(offset, entityId)
            offset += 4
            dataView.setUint8(offset, type)
            offset += 1
            if (type === OperationType.AddComponent || 
                type === OperationType.RemoveComponent || 
                type === OperationType.AddRelation ||
                type === OperationType.RemoveRelation) {
                dataView.setUint8(offset, componentId)
                offset += 1
                
                if (type === OperationType.AddRelation || type === OperationType.RemoveRelation) {
                    dataView.setUint32(offset, targetId)
                    offset += 4
                    
                    if (type === OperationType.AddRelation && relationData) {
                        offset = serializeRelationData(relationData, entityId, dataView, offset)
                    }
                }
            }
        }
        queue.length = 0

        return buffer.slice(0, offset)
    }
}

/**
 * Creates a deserializer for applying serialized changes to a world.
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
            let targetId = -1
            
            if (operationType === OperationType.AddComponent || 
                operationType === OperationType.RemoveComponent ||
                operationType === OperationType.AddRelation ||
                operationType === OperationType.RemoveRelation) {
                componentId = dataView.getUint8(offset)
                offset += 1
                
                if (operationType === OperationType.AddRelation || operationType === OperationType.RemoveRelation) {
                    targetId = dataView.getUint32(offset)
                    offset += 4
                }
            }

            const component = components[componentId]
            let worldEntityId = entityIdMapping.get(packetEntityId)

            if (operationType === OperationType.AddEntity) {
                if (worldEntityId === undefined) {
                    worldEntityId = addEntity(world)
                    entityIdMapping.set(packetEntityId, worldEntityId)
                    addComponent(world, worldEntityId, networkedTag)
                } else {
                    throw new Error(`Entity with ID ${packetEntityId} already exists in the mapping.`)
                }
            } else if (worldEntityId !== undefined && entityExists(world, worldEntityId)) {
                if (operationType === OperationType.RemoveEntity) {
                    removeEntity(world, worldEntityId)
                } else if (operationType === OperationType.AddComponent) {
                    addComponent(world, worldEntityId, component)
                } else if (operationType === OperationType.RemoveComponent) {
                    removeComponent(world, worldEntityId, component)
                } else if (operationType === OperationType.AddRelation) {
                    const worldTargetId = entityIdMapping.get(targetId)
                    if (worldTargetId !== undefined) {
                        const relationComponent = component(worldTargetId)
                        addComponent(world, worldEntityId, relationComponent)
                        offset = deserializeRelationData(relationComponent, worldEntityId, dataView, offset)
                    }
                } else if (operationType === OperationType.RemoveRelation) {
                    const worldTargetId = entityIdMapping.get(targetId)
                    if (worldTargetId !== undefined) {
                        removeComponent(world, worldEntityId, component(worldTargetId))
                    }
                }
            }
        }

        return entityIdMapping
    }
}
