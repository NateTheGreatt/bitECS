import { 
    $u8, $i8, $u16, $i16, $u32, $i32, $f32, $f64, $arr,
    TypedArray, TypeSymbol, PrimitiveBrand, ArrayType,
    typeSetters, typeGetters, getTypeForArray, isArrayType, getArrayElementType,
    serializeArrayValue, deserializeArrayValue
} from './SoASerializer'

/**
 * Component reference for AoS serialization - a component array where each element stores object data
 */
export type AoSComponentRef =
    | PrimitiveBrand
    | TypedArray
    | ArrayType<any>
    | Record<string, PrimitiveBrand | TypedArray | ArrayType<any>>

/**
 * Checks if an array type is a float type
 */
const isFloatType = (array: any) => {
    const arrayType = getTypeForArray(array)
    return arrayType === $f32 || arrayType === $f64
}

/**
 * Gets epsilon value for an array type (0 for non-floats)
 */
const getEpsilonForType = (array: any, epsilon: number) => 
    isFloatType(array) ? epsilon : 0

/**
 * Gets or creates a shadow component array for change detection
 */
const getShadowComponent = (shadowMap: Map<any, any>, component: AoSComponentRef) => {
    let shadow = shadowMap.get(component)
    if (!shadow) {
        shadow = []
        shadowMap.set(component, shadow)
    }
    return shadow
}

/**
 * Checks if a component value has changed for a specific entity
 */
const hasComponentChanged = (shadowMap: Map<any, any>, component: AoSComponentRef, entityId: number, epsilon: number) => {
    const shadow = getShadowComponent(shadowMap, component)
    const currentValue = component[entityId]
    const shadowValue = shadow[entityId]
    
    if (currentValue === undefined) return false
    if (shadowValue === undefined) return true
    
    if (typeof currentValue === 'object' && currentValue !== null) {
        // Object component - check each property
        const componentDef = component as any // Has property definitions
        for (const prop in currentValue) {
            if (componentDef[prop]) {
                const propEpsilon = getEpsilonForType(componentDef[prop], epsilon)
                const changed = propEpsilon > 0
                    ? Math.abs(shadowValue[prop] - currentValue[prop]) > propEpsilon
                    : shadowValue[prop] !== currentValue[prop]
                if (changed) return true
            }
        }
        return false
    } else {
        // Direct value component
        const valueEpsilon = getEpsilonForType(component, epsilon)
        return valueEpsilon > 0
            ? Math.abs(shadowValue - currentValue) > valueEpsilon
            : shadowValue !== currentValue
    }
}

/**
 * Updates shadow with current value
 */
const updateShadow = (shadowMap: Map<any, any>, component: AoSComponentRef, entityId: number) => {
    const shadow = getShadowComponent(shadowMap, component)
    const currentValue = component[entityId]
    
    if (typeof currentValue === 'object' && currentValue !== null) {
        // Deep copy object
        shadow[entityId] = { ...currentValue }
    } else {
        // Direct value
        shadow[entityId] = currentValue
    }
}

/**
 * Creates a serializer for a single AoS component
 */
const createAoSComponentSerializer = (component: AoSComponentRef, diff: boolean, shadowMap?: Map<any, any>, epsilon = 0.0001) => {
    // Determine if this is an object component by checking if it has property definitions
    const isObjectComponent = typeof component === 'object' && 
        Object.keys(component).some(key => isNaN(parseInt(key)) && typeof component[key] === 'object')
    
    if (isObjectComponent) {
        // Object component like { x: f32(), y: f32() }
        const props = Object.keys(component).filter(key => isNaN(parseInt(key)))
        const types = props.map(prop => getTypeForArray(component[prop]))
        const setters = types.map(type => typeSetters[type])
        
        return (view: DataView, offset: number, entityId: number) => {
            const value = component[entityId]
            if (value === undefined) return 0
            
            if (diff && shadowMap) {
                if (!hasComponentChanged(shadowMap, component, entityId, epsilon)) {
                    return 0
                }
                updateShadow(shadowMap, component, entityId)
            }
            
            let bytesWritten = 0
            
            // Serialize all properties
            for (let i = 0; i < props.length; i++) {
                const prop = component[props[i]]
                const propValue = value[props[i]]
                
                if (isArrayType(prop)) {
                    bytesWritten += serializeArrayValue(getArrayElementType(prop), propValue, view, offset + bytesWritten)
                } else {
                    bytesWritten += setters[i](view, offset + bytesWritten, propValue)
                }
            }
            
            return bytesWritten
        }
    } else {
        // Direct value component
        const type = getTypeForArray(component as PrimitiveBrand | TypedArray | ArrayType<any>)
        const setter = typeSetters[type]
        
        return (view: DataView, offset: number, entityId: number) => {
            const value = (component as any)[entityId]
            if (value === undefined) return 0
            
            if (diff && shadowMap) {
                if (!hasComponentChanged(shadowMap, component as any, entityId, epsilon)) {
                    return 0
                }
                updateShadow(shadowMap, component as any, entityId)
            }
            
            return setter(view, offset, value)
        }
    }
}

/**
 * Creates a deserializer for a single AoS component
 */
const createAoSComponentDeserializer = (component: AoSComponentRef) => {
    // Determine if this is an object component
    const isObjectComponent = typeof component === 'object' && 
        Object.keys(component).some(key => isNaN(parseInt(key)) && typeof component[key] === 'object')
    
    if (isObjectComponent) {
        // Object component
        const props = Object.keys(component).filter(key => isNaN(parseInt(key)))
        const types = props.map(prop => getTypeForArray(component[prop]))
        const getters = types.map(type => typeGetters[type])
        
        return (view: DataView, offset: number, entityId: number) => {
            let bytesRead = 0
            const value: any = {}
            
            // Deserialize all properties
            for (let i = 0; i < props.length; i++) {
                const prop = component[props[i]]
                
                if (isArrayType(prop)) {
                    const { value: propValue, size } = deserializeArrayValue(getArrayElementType(prop), view, offset + bytesRead)
                    if (Array.isArray(propValue)) {
                        value[props[i]] = propValue
                    }
                    bytesRead += size
                } else {
                    const { value: propValue, size } = getters[i](view, offset + bytesRead)
                    value[props[i]] = propValue
                    bytesRead += size
                }
            }
            
            component[entityId] = value
            return bytesRead
        }
    } else {
        // Direct value component
        const type = getTypeForArray(component as PrimitiveBrand | TypedArray | ArrayType<any>)
        const getter = typeGetters[type]
        
        return (view: DataView, offset: number, entityId: number) => {
            const { value, size } = getter(view, offset)
            ;(component as any)[entityId] = value
            return size
        }
    }
}

/**
 * Options for AoS serializer
 */
export type AoSSerializerOptions = {
    diff?: boolean
    buffer?: ArrayBuffer
    epsilon?: number
}

/**
 * Creates a serializer function for Array of Structures (AoS) components.
 * @param {AoSComponentRef[]} components - The AoS components to serialize.
 * @param {AoSSerializerOptions} [options] - Serializer options.
 * @returns {Function} A function that serializes the AoS data.
 */
export const createAoSSerializer = (components: AoSComponentRef[], options: AoSSerializerOptions = {}) => {
    const { 
        diff = false, 
        buffer = new ArrayBuffer(1024 * 1024 * 100), 
        epsilon = 0.0001 
    } = options

    const view = new DataView(buffer)
    const shadowMap = diff ? new Map<any, any>() : undefined
    const componentSerializers = components.map(component => 
        createAoSComponentSerializer(component, diff, shadowMap, epsilon)
    )

    return (entityIds: number[] | readonly number[]): ArrayBuffer => {
        let offset = 0
        
        for (let i = 0; i < entityIds.length; i++) {
            const entityId = entityIds[i]
            
            if (diff) {
                // Check if any component has changes for this entity
                let entityHasChanges = false
                for (let j = 0; j < components.length; j++) {
                    if (shadowMap && hasComponentChanged(shadowMap, components[j], entityId, epsilon)) {
                        entityHasChanges = true
                        break
                    }
                }
                
                if (!entityHasChanges) continue
                
                // Write entity ID
                offset += typeSetters[$u32](view, offset, entityId)
                
                // Write changed components and build mask
                const maskOffset = offset
                const maskSetter = components.length <= 8 ? typeSetters[$u8] : components.length <= 16 ? typeSetters[$u16] : typeSetters[$u32]
                offset += maskSetter === typeSetters[$u8] ? 1 : maskSetter === typeSetters[$u16] ? 2 : 4
                
                let componentMask = 0
                for (let j = 0; j < componentSerializers.length; j++) {
                    const bytesWritten = componentSerializers[j](view, offset, entityId)
                    if (bytesWritten > 0) {
                        componentMask |= 1 << j
                        offset += bytesWritten
                    }
                }
                
                // Write the component mask
                maskSetter(view, maskOffset, componentMask)
            } else {
                // Write entity ID
                offset += typeSetters[$u32](view, offset, entityId)
                
                // Write all components
                for (let j = 0; j < componentSerializers.length; j++) {
                    offset += componentSerializers[j](view, offset, entityId)
                }
            }
        }
        
        return buffer.slice(0, offset)
    }
}

/**
 * Options for AoS deserializer
 */
export type AoSDeserializerOptions = {
    diff?: boolean
}

/**
 * Creates a deserializer function for Array of Structures (AoS) components.
 * @param {AoSComponentRef[]} components - The AoS components to deserialize.
 * @param {AoSDeserializerOptions} [options] - Deserializer options.
 * @returns {Function} A function that deserializes the AoS data.
 */
export const createAoSDeserializer = (components: AoSComponentRef[], options: AoSDeserializerOptions = {}) => {
    const { diff = false } = options
    const componentDeserializers = components.map(component => createAoSComponentDeserializer(component))

    return (packet: ArrayBuffer, entityIdMapping?: Map<number, number>): void => {
        const view = new DataView(packet)
        let offset = 0

        while (offset < packet.byteLength) {
            // Read entity ID
            const { value: originalEntityId, size: entityIdSize } = typeGetters[$u32](view, offset)
            offset += entityIdSize
            const entityId = entityIdMapping ? entityIdMapping.get(originalEntityId) ?? originalEntityId : originalEntityId

            if (diff) {
                // Read component mask
                const maskGetter = components.length <= 8 ? typeGetters[$u8] : components.length <= 16 ? typeGetters[$u16] : typeGetters[$u32]
                const { value: componentMask, size: maskSize } = maskGetter(view, offset)
                offset += maskSize

                // Read changed components
                for (let i = 0; i < components.length; i++) {
                    if (componentMask & (1 << i)) {
                        offset += componentDeserializers[i](view, offset, entityId)
                    }
                }
            } else {
                // Read all components
                for (let i = 0; i < componentDeserializers.length; i++) {
                    offset += componentDeserializers[i](view, offset, entityId)
                }
            }
        }
    }
}