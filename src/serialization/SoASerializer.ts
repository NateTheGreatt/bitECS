
/**
 * Symbols representing different data types for serialization.
 */
export const $u8 = Symbol.for('bitecs-u8'), $i8 = Symbol.for('bitecs-i8'), $u16 = Symbol.for('bitecs-u16'), $i16 = Symbol.for('bitecs-i16'),
    $u32 = Symbol.for('bitecs-u32'), $i32 = Symbol.for('bitecs-i32'), $f32 = Symbol.for('bitecs-f32'), $f64 = Symbol.for('bitecs-f64'),
    $ref = Symbol.for('bitecs-ref'),
    $str = Symbol.for('bitecs-str'),
    $arr = Symbol.for('bitecs-arr')

/**
 * Union type of all possible TypedArray types.
 */
export type TypedArray = 
    | Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

/**
 * Union type of all possible type symbols.
 */
export type TypeSymbol = typeof $u8 | typeof $i8 | typeof $u16 | typeof $i16 | typeof $u32 | typeof $i32 | typeof $f32 | typeof $f64 | typeof $str | typeof $ref

/**
 * Type representing a primitive brand, which is either a number array with a symbol property or a TypedArray.
 */
export type PrimitiveBrand = ((number[] | string[]) & { [key: symbol]: true }) | TypedArray

/**
 * Type representing a component reference, which is a record mapping string keys to either
 * a PrimitiveBrand (number array with type symbol), TypedArray, or ArrayType values.
 * Used to define the structure of components that can be serialized.
 */
export type ComponentRef = Record<string, any>

export type ArrayType<T> = T[] & { [$arr]: TypeSymbol | TypeFunction | ArrayType<any> }

/**
 * Creates a function that tags an array with a type symbol for serialization.
 * @param {TypeSymbol} symbol - The type symbol to tag the array with.
 * @returns {Function} A function that tags an array with the given type symbol.
 */
const typeTagForSerialization = <T extends any[] = number[]>(symbol: TypeSymbol) => (a: T = [] as T): T & { [key: symbol]: true } =>
    Object.defineProperty(a, symbol, { value: true, enumerable: false, writable: false, configurable: false }) as T & { [key: symbol]: true }

/**
 * Functions to create arrays tagged with specific type symbols.
 */
export const u8 = (a: number[] = []): number[] => typeTagForSerialization($u8)(a) as number[],
            i8 = (a: number[] = []): number[] => typeTagForSerialization($i8)(a) as number[],
            u16 = (a: number[] = []): number[] => typeTagForSerialization($u16)(a) as number[],
            i16 = (a: number[] = []): number[] => typeTagForSerialization($i16)(a) as number[],
            u32 = (a: number[] = []): number[] => typeTagForSerialization($u32)(a) as number[],
            i32 = (a: number[] = []): number[] => typeTagForSerialization($i32)(a) as number[],
            f32 = (a: number[] = []): number[] => typeTagForSerialization($f32)(a) as number[],
            f64 = (a: number[] = []): number[] => typeTagForSerialization($f64)(a) as number[],
            ref = (a: number[] = []): number[] => typeTagForSerialization($ref)(a) as number[],
            str = (a: string[] = []): string[] => typeTagForSerialization<string[]>($str)(a) as string[]

/**
 * Type representing a type function.
 */
type TypeFunction = typeof u8 | typeof i8 | typeof u16 | typeof i16 | typeof u32 | typeof i32 | typeof f32 | typeof f64 | typeof str | typeof ref

/**
 * Mapping from type functions to their corresponding symbols.
 */
const functionToSymbolMap = new Map<TypeFunction, TypeSymbol>([
    [u8, $u8], [i8, $i8], [u16, $u16], [i16, $i16],
    [u32, $u32], [i32, $i32], [f32, $f32], [f64, $f64],
    [ref, $ref],
    [str, $str]
])

/**
 * Object containing setter functions for each data type.
 */
export const typeSetters: Record<TypeSymbol, (view: DataView, offset: number, value: any) => number> = {
    [$u8]: (view: DataView, offset: number, value: number) => { view.setUint8(offset, value); return 1; },
    [$i8]: (view: DataView, offset: number, value: number) => { view.setInt8(offset, value); return 1; },
    [$u16]: (view: DataView, offset: number, value: number) => { view.setUint16(offset, value); return 2; },
    [$i16]: (view: DataView, offset: number, value: number) => { view.setInt16(offset, value); return 2; },
    [$u32]: (view: DataView, offset: number, value: number) => { view.setUint32(offset, value); return 4; },
    [$i32]: (view: DataView, offset: number, value: number) => { view.setInt32(offset, value); return 4; },
    [$f32]: (view: DataView, offset: number, value: number) => { view.setFloat32(offset, value); return 4; },
    [$f64]: (view: DataView, offset: number, value: number) => { view.setFloat64(offset, value); return 8; },
    [$ref]: (view: DataView, offset: number, value: number) => { view.setUint32(offset, value); return 4; },
    [$str]: (view: DataView, offset: number, value: string) => {
        const enc = textEncoder
        const bytes = enc.encode(value)
        let written = 0
        written += typeSetters[$u32](view, offset + written, bytes.length)
        new Uint8Array(view.buffer, view.byteOffset + offset + written, bytes.length).set(bytes)
        written += bytes.length
        return written
    }
} as Record<TypeSymbol, (view: DataView, offset: number, value: any) => number>

/**
 * Object containing getter functions for each data type.
 */
export const typeGetters: Record<TypeSymbol, (view: DataView, offset: number) => { value: any, size: number }> = {
    [$u8]: (view: DataView, offset: number) => ({ value: view.getUint8(offset), size: 1 }),
    [$i8]: (view: DataView, offset: number) => ({ value: view.getInt8(offset), size: 1 }),
    [$u16]: (view: DataView, offset: number) => ({ value: view.getUint16(offset), size: 2 }),
    [$i16]: (view: DataView, offset: number) => ({ value: view.getInt16(offset), size: 2 }),
    [$u32]: (view: DataView, offset: number) => ({ value: view.getUint32(offset), size: 4 }),
    [$i32]: (view: DataView, offset: number) => ({ value: view.getInt32(offset), size: 4 }),
    [$f32]: (view: DataView, offset: number) => ({ value: view.getFloat32(offset), size: 4 }),
    [$f64]: (view: DataView, offset: number) => ({ value: view.getFloat64(offset), size: 8 }),
    [$ref]: (view: DataView, offset: number) => ({ value: view.getUint32(offset), size: 4 }),
    [$str]: (view: DataView, offset: number) => {
        const { value: len, size: lenSize } = typeGetters[$u32](view, offset)
        const bytes = new Uint8Array(view.buffer, view.byteOffset + offset + lenSize, len)
        const dec = textDecoder
        const strValue = dec.decode(bytes)
        return { value: strValue, size: lenSize + len }
    }
} as Record<TypeSymbol, (view: DataView, offset: number) => { value: any, size: number }>

/**
 * Resolves a type (symbol, function, or array type) to its corresponding symbol.
 */
function resolveTypeToSymbol(type: TypeSymbol | TypeFunction | ArrayType<any>): TypeSymbol {
    if (typeof type === 'symbol') {
        return type
    }
    if (typeof type === 'function') {
        const symbol = functionToSymbolMap.get(type)
        if (symbol) return symbol
        throw new Error(`Unknown type function: ${type}`)
    }
    if (isArrayType(type)) {
        return resolveTypeToSymbol(type[$arr])
    }
    // Default fallback
    return $f32
}
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export function array(type: typeof $str | typeof str): ArrayType<string[]>
export function array(type?: TypeSymbol | TypeFunction): ArrayType<number[]>
export function array<T>(type: ArrayType<T>): ArrayType<T[]>
export function array(type: TypeSymbol | TypeFunction | ArrayType<any> = f64): ArrayType<any> {
	const arr = [] as any[]
	Object.defineProperty(arr, $arr, { value: type, enumerable: false, writable: false, configurable: false })
	return arr as ArrayType<any>
}

/**
 * Checks if a value is a TypedArray, branded array, or ArrayType
 */
function isTypedArrayOrBranded(arr: any): arr is PrimitiveBrand | TypedArray | ArrayType<any> {
    return arr && (
        ArrayBuffer.isView(arr) || 
        (Array.isArray(arr) && typeof arr === 'object')
    )
}

/**
 * Gets the type symbol for an array
 */
export function getTypeForArray(arr: PrimitiveBrand | TypedArray | ArrayType<any>): TypeSymbol {
    // Check for ArrayType first
    if (isArrayType(arr)) {
        return resolveTypeToSymbol(arr[$arr])
    }
    // Check for branded arrays
    for (const symbol of [$u8, $i8, $u16, $i16, $u32, $i32, $f32, $f64, $str, $ref] as TypeSymbol[]) {
        if (symbol in arr) return symbol
    }
    // Then check TypedArrays
    if (arr instanceof Int8Array) return $i8
    if (arr instanceof Uint8Array) return $u8
    if (arr instanceof Int16Array) return $i16
    if (arr instanceof Uint16Array) return $u16
    if (arr instanceof Int32Array) return $i32
    if (arr instanceof Uint32Array) return $u32
    if (arr instanceof Float32Array) return $f32
    return $f64
}

/**
 * Checks if a value is an array type
 */
export function isArrayType(value: any): value is ArrayType<any> {
    return Array.isArray(value) && $arr in value
}

/**
 * Gets the element type information for an array type
 */
export function getArrayElementType(arrayType: ArrayType<any>): TypeSymbol | TypeFunction | ArrayType<any> {
    return arrayType[$arr]
}

/**
 * Serializes an array value to a DataView
 */
export function serializeArrayValue(
    elementType: ArrayType<any> | TypeSymbol | TypeFunction,
    value: any[],
    view: DataView,
    offset: number
): number {
    let bytesWritten = 0

    const isArrayDefined = Array.isArray(value) ? 1 : 0
    bytesWritten += typeSetters[$u8](view, offset, isArrayDefined)

    if (!isArrayDefined) {
        return bytesWritten
    }

    bytesWritten += typeSetters[$u32](view, offset + bytesWritten, value.length)

    // Write each element
    for (let i = 0; i < value.length; i++) {
        const element = value[i]
        if (isArrayType(elementType)) {
            bytesWritten += serializeArrayValue(getArrayElementType(elementType), element, view, offset + bytesWritten)
        } else {
            // Primitive type - resolve to symbol
            const symbol = resolveTypeToSymbol(elementType)
            bytesWritten += typeSetters[symbol](view, offset + bytesWritten, element)
        }
    }

    return bytesWritten
}


export function deserializeArrayValue(
    elementType: ArrayType<any> | TypeSymbol | TypeFunction,
    view: DataView,
    offset: number,
    entityIdMapping?: Map<number, number>
) {
    let bytesRead = 0

    const isArrayResult = typeGetters[$u8](view, offset + bytesRead)
    bytesRead += isArrayResult.size
    if (!isArrayResult.value) {
        return { size: bytesRead }
    }

    const arrayLengthResult = typeGetters[$u32](view, offset + bytesRead)
    bytesRead += arrayLengthResult.size;

    const arr = new Array(arrayLengthResult.value) as any;
    for (let i = 0; i < arr.length; i++) {
        if (isArrayType(elementType)) {
            const { value, size } = deserializeArrayValue(getArrayElementType(elementType), view, offset + bytesRead, entityIdMapping)
            bytesRead += size
            if (Array.isArray(value)) {
                arr[i] = value
            }
        } else {
            // Primitive type - resolve to symbol
            const symbol = resolveTypeToSymbol(elementType)
            const { value, size } = typeGetters[symbol](view, offset + bytesRead)
            bytesRead += size
            if (symbol === $ref) {
                const mapped = entityIdMapping ? entityIdMapping.get(value) ?? value : value
                arr[i] = mapped
            } else {
                arr[i] = value
            }
        }
    }

    return { value: arr, size: bytesRead }
}

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
 * Gets or creates a shadow array for change detection
 */
const getShadow = (shadowMap: Map<any, any>, array: any) => {
    let shadow = shadowMap.get(array)
    if (!shadow) {
        if (ArrayBuffer.isView(array)) {
            shadow = new (array.constructor as any)((array as any).length)
        } else {
            shadow = new Array(array.length)
        }
        shadowMap.set(array, shadow)
    }
    return shadow
}

/**
 * Checks if a value has changed and updates the shadow
 */
const hasChanged = (shadowMap: Map<any, any>, array: any, index: number, epsilon = 0.0001) => {
    const shadow = getShadow(shadowMap, array)
    const currentValue = array[index]
    const shadowValue = shadow[index]
    
    if (currentValue === undefined && shadowValue === undefined) {
        return false
    }
    
    if (shadowValue === undefined) {
        shadow[index] = currentValue
        return true
    }
    
    if (currentValue === undefined) {
        shadow[index] = undefined
        return true
    }
    
    const actualEpsilon = getEpsilonForType(array, epsilon)
    const changed = actualEpsilon > 0
        ? Math.abs(shadowValue - currentValue) > actualEpsilon
        : shadowValue !== currentValue
    
    shadow[index] = currentValue
    return changed
}

/**
 * Creates a serializer function for a component.
 * @param {ComponentRef} component - The component to create a serializer for.
 * @param {boolean} diff - Whether to use diff mode (only serialize changed values).
 * @param {Map} shadowMap - Map to store shadow copies for diff mode.
 * @param {number} epsilon - Epsilon for float comparison in diff mode.
 * @returns {Function} A function that serializes the component.
 */
export const createComponentSerializer = (component: ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>, diff = false, shadowMap?: Map<any, any>, epsilon = 0.0001) => {
    // Handle direct array case
    if (isTypedArrayOrBranded(component)) {
        const type = getTypeForArray(component)
        const setter = typeSetters[type]
        return (view: DataView, offset: number, index: number, componentId: number) => {
            if (diff && shadowMap) {
                if (!hasChanged(shadowMap, component, index, epsilon)) return 0 // No change
                
                let bytesWritten = 0
                bytesWritten += typeSetters[$u32](view, offset + bytesWritten, index) // eid
                bytesWritten += typeSetters[$u32](view, offset + bytesWritten, componentId) // cid
                bytesWritten += setter(view, offset + bytesWritten, component[index])
                return bytesWritten
            } else {
                let bytesWritten = 0
                bytesWritten += typeSetters[$u32](view, offset + bytesWritten, index) // eid
                bytesWritten += setter(view, offset + bytesWritten, component[index])
                return bytesWritten
            }
        }
    }

    // Handle component case
    const props = Object.keys(component)
    const types = props.map(prop => {
        const arr = component[prop]
        if (!isTypedArrayOrBranded(arr)) {
            throw new Error(`Invalid array type for property ${prop}`)
        }
        return getTypeForArray(arr)
    })
    const setters = types.map(type => typeSetters[type as keyof typeof typeSetters] || (() => { throw new Error(`Unsupported or unannotated type`); }))
    return (view: DataView, offset: number, index: number, componentId: number) => {
        if (diff && shadowMap) {
            let changeMask = 0
            // First pass: check what changed and build mask
            for (let i = 0; i < props.length; i++) {
                const componentProperty = component[props[i]]
                
                if (hasChanged(shadowMap, componentProperty, index, epsilon)) {
                    changeMask |= 1 << i
                }
            }
            
            if (changeMask === 0) return 0 // No changes for this component
            
            let bytesWritten = 0
            bytesWritten += typeSetters[$u32](view, offset + bytesWritten, index) // eid
            bytesWritten += typeSetters[$u32](view, offset + bytesWritten, componentId) // cid
            
            // Write mask
            const maskSetter = props.length <= 8 ? typeSetters[$u8] : props.length <= 16 ? typeSetters[$u16] : typeSetters[$u32]
            bytesWritten += maskSetter(view, offset + bytesWritten, changeMask)
            
            // Write only changed values (shadows already updated by hasChanged)
            for (let i = 0; i < props.length; i++) {
                if (changeMask & (1 << i)) {
                    const componentProperty = component[props[i]]
                    
                    if (isArrayType(componentProperty)) {
                        bytesWritten += serializeArrayValue(getArrayElementType(componentProperty), componentProperty[index], view, offset + bytesWritten)
                    } else {
                        bytesWritten += setters[i](view, offset + bytesWritten, componentProperty[index])
                    }
                }
            }
            return bytesWritten
        } else {
            let bytesWritten = 0
            bytesWritten += typeSetters[$u32](view, offset + bytesWritten, index) // eid
            for (let i = 0; i < props.length; i++) {
                const componentProperty = component[props[i]]
                if (isArrayType(componentProperty)) {
                    bytesWritten += serializeArrayValue(getArrayElementType(componentProperty), componentProperty[index], view, offset + bytesWritten)
                } else {
                    bytesWritten += setters[i](view, offset + bytesWritten, componentProperty[index])
                }
            }
            return bytesWritten
        }
    }
}

/**
 * Creates a deserializer function for a component.
 * @param {ComponentRef} component - The component to create a deserializer for.
 * @param {boolean} diff - Whether to expect diff mode data with change masks.
 * @returns {Function} A function that deserializes the component.
 */
export const createComponentDeserializer = (component: ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>, diff = false) => {
    // Handle direct array case
    if (isTypedArrayOrBranded(component)) {
        const type = getTypeForArray(component)
        const getter = typeGetters[type]
        return (view: DataView, offset: number, entityIdMapping?: Map<number, number>) => {
            let bytesRead = 0
            const { value: originalIndex, size: indexSize } = typeGetters[$u32](view, offset)
            bytesRead += indexSize
            const index = entityIdMapping ? entityIdMapping.get(originalIndex) ?? originalIndex : originalIndex
            
            if (diff) {
                // Skip cid (component ID)
                const { size: cidSize } = typeGetters[$u32](view, offset + bytesRead)
                bytesRead += cidSize
            }
            
            const { value, size } = getter(view, offset + bytesRead)
            if (type === $ref) {
                const mapped = entityIdMapping ? entityIdMapping.get(value) ?? value : value
                ;(component as any)[index] = mapped
            } else {
                ;(component as any)[index] = value
            }
            return bytesRead + size
        }
    }

    // Handle component case
    const props = Object.keys(component)
    const types = props.map(prop => {
        const arr = component[prop]
        if (!isTypedArrayOrBranded(arr)) {
            throw new Error(`Invalid array type for property ${prop}`)
        }
        return getTypeForArray(arr)
    })
    const getters = types.map(type => typeGetters[type as keyof typeof typeGetters] || (() => { throw new Error(`Unsupported or unannotated type`); }))
    return (view: DataView, offset: number, entityIdMapping?: Map<number, number>) => {
        let bytesRead = 0

        const { value: originalIndex, size: indexSize } = typeGetters[$u32](view, offset + bytesRead)
        bytesRead += indexSize
        
        const index = entityIdMapping ? entityIdMapping.get(originalIndex) ?? originalIndex : originalIndex
        
        if (diff) {
            // Skip cid (component ID)
            const { size: cidSize } = typeGetters[$u32](view, offset + bytesRead)
            bytesRead += cidSize
            
            const maskGetter = props.length <= 8 ? typeGetters[$u8] : props.length <= 16 ? typeGetters[$u16] : typeGetters[$u32]
            const { value: changeMask, size: maskSize } = maskGetter(view, offset + bytesRead)
            bytesRead += maskSize
            
            for (let i = 0; i < props.length; i++) {
                if (changeMask & (1 << i)) {
                    const componentProperty = component[props[i]]
                    if (isArrayType(componentProperty)) {
                        const { value, size } = deserializeArrayValue(getArrayElementType(componentProperty), view, offset + bytesRead, entityIdMapping)
                        if (Array.isArray(value)){
                            componentProperty[index] = value
                        }
                        bytesRead += size
                    } else {
                        const { value, size } = getters[i](view, offset + bytesRead)
                        if (types[i] === $ref) {
                            const mapped = entityIdMapping ? entityIdMapping.get(value) ?? value : value
                            component[props[i]][index] = mapped
                        } else {
                            component[props[i]][index] = value
                        }
                        bytesRead += size
                    }
                }
            }
        } else {
            for (let i = 0; i < props.length; i++) {
                const componentProperty = component[props[i]]
                if (isArrayType(componentProperty)) {
                    const { value, size } = deserializeArrayValue(getArrayElementType(componentProperty), view, offset + bytesRead, entityIdMapping)
                    if (Array.isArray(value)){
                        componentProperty[index] = value
                    }
                    bytesRead += size
                } else {
                    const { value, size } = getters[i](view, offset + bytesRead)
                    if (types[i] === $ref) {
                        const mapped = entityIdMapping ? entityIdMapping.get(value) ?? value : value
                        component[props[i]][index] = mapped
                    } else {
                        component[props[i]][index] = value
                    }
                    bytesRead += size
                }
            }
        }
        return bytesRead
    }
}

/**
 * Options for SoA serializer
 */
export type SoASerializerOptions = {
    diff?: boolean
    buffer?: ArrayBuffer
    epsilon?: number
    /**
     * Optional callback that returns the set of entity IDs removed since the
     * last call and clears the tracking set. When provided, the serializer
     * clears stale shadow values for ALL component arrays at those EID slots
     * before each diff pass.
     * Typically supplied via ObserverSerializerFunction.getRemovals.
     */
    getRemovals?: () => Set<number>
}

/**
 * Clears shadow entries for a specific entity ID across all component arrays.
 */
const clearEntityShadow = (shadowMap: Map<any, any>, eid: number) => {
    for (const shadow of shadowMap.values()) {
        shadow[eid] = undefined
    }
}

/**
 * Creates a serializer function for Structure of Arrays (SoA) data.
 * @param {ComponentRef[]} components - The components to serialize.
 * @param {SoASerializerOptions} [options] - Serializer options.
 * @returns {SoASerializerFunction} A serializer with an optional clearEntity method in diff mode.
 */
export const createSoASerializer = (components: (ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>)[], options: SoASerializerOptions = {}): SoASerializerFunction => {
    const {
        diff = false,
        buffer = new ArrayBuffer(1024 * 1024 * 100),
        epsilon = 0.0001,
        getRemovals,
    } = options
    const view = new DataView(buffer)
    const shadowMap = diff ? new Map() : undefined
    const componentSerializers = components.map(component => createComponentSerializer(component, diff, shadowMap, epsilon))

    const serialize = (indices: number[] | readonly number[]): ArrayBuffer => {
        // Before diffing, clear shadow for any entities that were removed since
        // the last call.
        if (diff && shadowMap && getRemovals) {
            for (const eid of getRemovals()) {
                clearEntityShadow(shadowMap, eid)
            }
        }

        let offset = 0
        for (let i = 0; i < indices.length; i++) {
            const index = indices[i]
            for (let j = 0; j < componentSerializers.length; j++) {
                offset += componentSerializers[j](view, offset, index, j) // Pass component ID
            }
        }
        return buffer.slice(0, offset)
    }

    const result = serialize as SoASerializerFunction
    if (diff && shadowMap) {
        result.clearEntity = (eid: number) => clearEntityShadow(shadowMap, eid)
    }
    return result
}

export type SoASerializerFunction = {
    (indices: number[] | readonly number[]): ArrayBuffer
    /** Clears shadow state for a specific entity ID (diff mode only). */
    clearEntity?: (eid: number) => void
}

/**
 * Options for SoA deserializer
 */
export type SoADeserializerOptions = {
    diff?: boolean
}

/**
 * Creates a deserializer function for Structure of Arrays (SoA) data.
 * @param {ComponentRef[]} components - The components to deserialize.
 * @param {SoADeserializerOptions} [options] - Deserializer options.
 * @returns {Function} A function that deserializes the SoA data.
 */
export const createSoADeserializer = (components: (ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>)[], options: SoADeserializerOptions = {}) => {
    const { diff = false } = options
    const componentDeserializers = components.map(component => createComponentDeserializer(component, diff))
    return (packet: ArrayBuffer, entityIdMapping?: Map<number, number>): void => {
        const view = new DataView(packet)
        let offset = 0
        while (offset < packet.byteLength) {
            if (diff) {
                // Read eid, cid
                const { value: originalEid, size: eidSize } = typeGetters[$u32](view, offset)
                const { value: componentId, size: cidSize } = typeGetters[$u32](view, offset + eidSize)
                
                // Call component deserializer starting from eid position
                offset += componentDeserializers[componentId](view, offset, entityIdMapping)
            } else {
                for (let i = 0; i < componentDeserializers.length; i++) {
                    offset += componentDeserializers[i](view, offset, entityIdMapping)
                }
            }
        }
    }
}
