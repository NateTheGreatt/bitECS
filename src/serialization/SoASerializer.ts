
/**
 * Symbols representing different data types for serialization.
 */
export const $u8 = Symbol.for('bitecs-u8'), $i8 = Symbol.for('bitecs-i8'), $u16 = Symbol.for('bitecs-u16'), $i16 = Symbol.for('bitecs-i16'),
    $u32 = Symbol.for('bitecs-u32'), $i32 = Symbol.for('bitecs-i32'), $f32 = Symbol.for('bitecs-f32'), $f64 = Symbol.for('bitecs-f64'),
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
export type TypeSymbol = typeof $u8 | typeof $i8 | typeof $u16 | typeof $i16 | typeof $u32 | typeof $i32 | typeof $f32 | typeof $f64 | typeof $str

/**
 * Type representing a primitive brand, which is either a number array with a symbol property or a TypedArray.
 */
export type PrimitiveBrand = ((number[] | string[]) & { [key: symbol]: true }) | TypedArray

/**
 * Type representing a component reference, which is a record mapping string keys to either
 * a PrimitiveBrand (number array with type symbol), TypedArray, or ArrayType values.
 * Used to define the structure of components that can be serialized.
 */
export type ComponentRef = Record<string, PrimitiveBrand | TypedArray | ArrayType<any>>

export type ArrayType<T> = T[] & { [$arr]: TypeSymbol | TypeFunction | ArrayType<any> }

/**
 * Creates a function that tags an array with a type symbol for serialization.
 * @param {TypeSymbol} symbol - The type symbol to tag the array with.
 * @returns {Function} A function that tags an array with the given type symbol.
 */
const typeTagForSerialization = (symbol: TypeSymbol) => (a: any[] = []): PrimitiveBrand =>
    Object.defineProperty(a, symbol, { value: true, enumerable: false, writable: false, configurable: false }) as PrimitiveBrand

/**
 * Functions to create arrays tagged with specific type symbols.
 */
export const u8 = typeTagForSerialization($u8),     i8 = typeTagForSerialization($i8),
            u16 = typeTagForSerialization($u16),    i16 = typeTagForSerialization($i16),
            u32 = typeTagForSerialization($u32),    i32 = typeTagForSerialization($i32),
            f32 = typeTagForSerialization($f32),    f64 = typeTagForSerialization($f64),
            str = typeTagForSerialization($str)

/**
 * Mapping from type functions to their corresponding symbols.
 */
const functionToSymbolMap = new Map([
    [u8, $u8], [i8, $i8], [u16, $u16], [i16, $i16],
    [u32, $u32], [i32, $i32], [f32, $f32], [f64, $f64],
    [str, $str]
])

/**
 * Type representing a type function.
 */
type TypeFunction = typeof u8 | typeof i8 | typeof u16 | typeof i16 | typeof u32 | typeof i32 | typeof f32 | typeof f64 | typeof str

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
        const symbol = functionToSymbolMap.get(type as TypeFunction) as TypeSymbol | undefined
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

export const array = <T extends any[] = any[]>(type: TypeSymbol | TypeFunction | ArrayType<any> = f32): ArrayType<T> => {
    const arr = [] as any[];

    Object.defineProperty(arr, $arr, { value: type, enumerable: false, writable: false, configurable: false })

    return arr as ArrayType<T>;
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
    for (const symbol of [$u8, $i8, $u16, $i16, $u32, $i32, $f32, $f64, $str] as TypeSymbol[]) {
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
    offset: number
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
            const { value, size } = deserializeArrayValue(getArrayElementType(elementType), view, offset + bytesRead)
            bytesRead += size
            if (Array.isArray(value)) {
                arr[i] = value
            }
        } else {
            // Primitive type - resolve to symbol
            const symbol = resolveTypeToSymbol(elementType)
            const { value, size } = typeGetters[symbol](view, offset + bytesRead)
            bytesRead += size
            arr[i] = value
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
        // Create shadow array with proper initialization
        if (ArrayBuffer.isView(array)) {
            // TypedArray
            shadow = new (array.constructor as any)((array as any).length)
        } else {
            // Regular array (like f32([]) arrays) - initialize with zeros
            shadow = new Array(array.length).fill(0)
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
    const actualEpsilon = getEpsilonForType(array, epsilon)
    
    const changed = actualEpsilon > 0
        ? Math.abs(shadow[index] - currentValue) > actualEpsilon
        : shadow[index] !== currentValue
    
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
            component[index] = value
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
                        const { value, size } = deserializeArrayValue(getArrayElementType(componentProperty), view, offset + bytesRead)
                        if (Array.isArray(value)){
                            componentProperty[index] = value
                        }
                        bytesRead += size
                    } else {
                        const { value, size } = getters[i](view, offset + bytesRead)
                        component[props[i]][index] = value
                        bytesRead += size
                    }
                }
            }
        } else {
            for (let i = 0; i < props.length; i++) {
                const componentProperty = component[props[i]]
                if (isArrayType(componentProperty)) {
                    const { value, size } = deserializeArrayValue(getArrayElementType(componentProperty), view, offset + bytesRead)
                    if (Array.isArray(value)){
                        componentProperty[index] = value
                    }
                    bytesRead += size
                } else {
                    const { value, size } = getters[i](view, offset + bytesRead)
                    component[props[i]][index] = value
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
}

/**
 * Creates a serializer function for Structure of Arrays (SoA) data.
 * @param {ComponentRef[]} components - The components to serialize.
 * @param {SoASerializerOptions} [options] - Serializer options.
 * @returns {Function} A function that serializes the SoA data.
 */
export const createSoASerializer = (components: (ComponentRef | PrimitiveBrand | TypedArray | ArrayType<any>)[], options: SoASerializerOptions = {}) => {
    const { 
        diff = false, 
        buffer = new ArrayBuffer(1024 * 1024 * 100), 
        epsilon = 0.0001 
    } = options
    const view = new DataView(buffer)
    const shadowMap = diff ? new Map() : undefined
    const componentSerializers = components.map(component => createComponentSerializer(component, diff, shadowMap, epsilon))
    return (indices: number[] | readonly number[]): ArrayBuffer => {
        let offset = 0
        for (let i = 0; i < indices.length; i++) {
            const index = indices[i]
            for (let j = 0; j < componentSerializers.length; j++) {
                offset += componentSerializers[j](view, offset, index, j) // Pass component ID
            }
        }
        return buffer.slice(0, offset)
    }
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
