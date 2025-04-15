
/**
 * Symbols representing different data types for serialization.
 */
export const $u8 = Symbol.for('bitecs-u8'), $i8 = Symbol.for('bitecs-i8'), $u16 = Symbol.for('bitecs-u16'), $i16 = Symbol.for('bitecs-i16'),
    $u32 = Symbol.for('bitecs-u32'), $i32 = Symbol.for('bitecs-i32'), $f32 = Symbol.for('bitecs-f32'), $f64 = Symbol.for('bitecs-f64'),
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
export type TypeSymbol = typeof $u8 | typeof $i8 | typeof $u16 | typeof $i16 | typeof $u32 | typeof $i32 | typeof $f32 | typeof $f64

/**
 * Type representing a primitive brand, which is either a number array with a symbol property or a TypedArray.
 */
export type PrimitiveBrand = (number[] & { [key: symbol]: true }) | TypedArray

/**
 * Type representing a component reference, which is a record mapping string keys to either
 * a PrimitiveBrand (number array with type symbol) or TypedArray values.
 * Used to define the structure of components that can be serialized.
 */
type ComponentRef = Record<string, PrimitiveBrand | TypedArray>

type ArrayType<T> = T[] & { $arr: TypeSymbol }

/**
 * Creates a function that tags an array with a type symbol for serialization.
 * @param {TypeSymbol} symbol - The type symbol to tag the array with.
 * @returns {Function} A function that tags an array with the given type symbol.
 */
const typeTagForSerialization = (symbol: TypeSymbol) => (a: number[] = []): PrimitiveBrand =>
    Object.defineProperty(a, symbol, { value: true, enumerable: false, writable: false, configurable: false }) as PrimitiveBrand

/**
 * Functions to create arrays tagged with specific type symbols.
 */
export const u8 = typeTagForSerialization($u8),     i8 = typeTagForSerialization($i8),
            u16 = typeTagForSerialization($u16),    i16 = typeTagForSerialization($i16),
            u32 = typeTagForSerialization($u32),    i32 = typeTagForSerialization($i32),
            f32 = typeTagForSerialization($f32),    f64 = typeTagForSerialization($f64)

/**
 * Object containing setter functions for each data type.
 */
const typeSetters = {
    [$u8]: (view: DataView, offset: number, value: number) => { view.setUint8(offset, value); return 1; },
    [$i8]: (view: DataView, offset: number, value: number) => { view.setInt8(offset, value); return 1; },
    [$u16]: (view: DataView, offset: number, value: number) => { view.setUint16(offset, value); return 2; },
    [$i16]: (view: DataView, offset: number, value: number) => { view.setInt16(offset, value); return 2; },
    [$u32]: (view: DataView, offset: number, value: number) => { view.setUint32(offset, value); return 4; },
    [$i32]: (view: DataView, offset: number, value: number) => { view.setInt32(offset, value); return 4; },
    [$f32]: (view: DataView, offset: number, value: number) => { view.setFloat32(offset, value); return 4; },
    [$f64]: (view: DataView, offset: number, value: number) => { view.setFloat64(offset, value); return 8; }
}

/**
 * Object containing getter functions for each data type.
 */
const typeGetters = {
    [$u8]: (view: DataView, offset: number) => ({ value: view.getUint8(offset), size: 1 }),
    [$i8]: (view: DataView, offset: number) => ({ value: view.getInt8(offset), size: 1 }),
    [$u16]: (view: DataView, offset: number) => ({ value: view.getUint16(offset), size: 2 }),
    [$i16]: (view: DataView, offset: number) => ({ value: view.getInt16(offset), size: 2 }),
    [$u32]: (view: DataView, offset: number) => ({ value: view.getUint32(offset), size: 4 }),
    [$i32]: (view: DataView, offset: number) => ({ value: view.getInt32(offset), size: 4 }),
    [$f32]: (view: DataView, offset: number) => ({ value: view.getFloat32(offset), size: 4 }),
    [$f64]: (view: DataView, offset: number) => ({ value: view.getFloat64(offset), size: 8 })
}

export const array = <T extends any[] = []>(type: TypeSymbol | T = $f32)=>  {
    const arr = [];

    Object.defineProperty(arr, $arr, { value: type, enumerable: false, writable: false, configurable: false })

    return arr as T[];
}

/**
 * Checks if a value is a TypedArray or branded array
 */
function isTypedArrayOrBranded(arr: any): arr is PrimitiveBrand | TypedArray {
    return arr && (
        ArrayBuffer.isView(arr) || 
        (Array.isArray(arr) && typeof arr === 'object')
    )
}

/**
 * Gets the type symbol for an array
 */
function getTypeForArray(arr: PrimitiveBrand | TypedArray): TypeSymbol {
    // Check for branded arrays first
    for (const symbol of [$u8, $i8, $u16, $i16, $u32, $i32, $f32, $f64] as TypeSymbol[]) {
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
export function getArrayElementType(arrayType: ArrayType<any>): TypeSymbol | ArrayType<any> {
    return arrayType[$arr]
}

/**
 * Serializes an array value to a DataView
 */
function serializeArrayValue(
    elementType: ArrayType<any> | TypeSymbol,
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
        } else if (typeof elementType === 'symbol') {
            // Primitive type
            bytesWritten += typeSetters[elementType](view, offset + bytesWritten, element)
        }
    }

    return bytesWritten
}


function deserializeArrayValue(
    elementType: ArrayType<any> | TypeSymbol,
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
            const { value, size } = typeGetters[elementType](view, offset + bytesRead)
            bytesRead += size
            arr[i] = value
        }
    }

    return { value: arr, size: bytesRead }
}

/**
 * Creates a serializer function for a component.
 * @param {ComponentRef} component - The component to create a serializer for.
 * @returns {Function} A function that serializes the component.
 */
export const createComponentSerializer = (component: ComponentRef | PrimitiveBrand | TypedArray) => {
    // Handle direct array case
    if (isTypedArrayOrBranded(component)) {
        const type = getTypeForArray(component)
        const setter = typeSetters[type]
        return (view: DataView, offset: number, index: number) => {
            let bytesWritten = 0
            bytesWritten += typeSetters[$u32](view, offset, index)
            bytesWritten += setter(view, offset + bytesWritten, component[index])
            return bytesWritten
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
    return (view: DataView, offset: number, index: number) => {
        let bytesWritten = 0
        // Write index first
        bytesWritten += typeSetters[$u32](view, offset + bytesWritten, index)
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

/**
 * Creates a deserializer function for a component.
 * @param {ComponentRef} component - The component to create a deserializer for.
 * @returns {Function} A function that deserializes the component.
 */
export const createComponentDeserializer = (component: ComponentRef | PrimitiveBrand | TypedArray) => {
    // Handle direct array case
    if (isTypedArrayOrBranded(component)) {
        const type = getTypeForArray(component)
        const getter = typeGetters[type]
        return (view: DataView, offset: number, entityIdMapping?: Map<number, number>) => {
            let bytesRead = 0
            const { value: originalIndex, size: indexSize } = typeGetters[$u32](view, offset)
            bytesRead += indexSize
            const index = entityIdMapping ? entityIdMapping.get(originalIndex) ?? originalIndex : originalIndex
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
        return bytesRead
    }
}

/**
 * Creates a serializer function for Structure of Arrays (SoA) data.
 * @param {ComponentRef[]} components - The components to serialize.
 * @param {ArrayBuffer} [buffer] - The buffer to use for serialization.
 * @returns {Function} A function that serializes the SoA data.
 */
export const createSoASerializer = (components: (ComponentRef | PrimitiveBrand | TypedArray)[], buffer: ArrayBuffer = new ArrayBuffer(1024 * 1024 * 100)) => {
    const view = new DataView(buffer)
    const componentSerializers = components.map(createComponentSerializer)
    return (indices: number[] | readonly number[]): ArrayBuffer => {
        let offset = 0
        for (let i = 0; i < indices.length; i++) {
            const index = indices[i]
            for (let j = 0; j < componentSerializers.length; j++) {
                offset += componentSerializers[j](view, offset, index)
            }
        }
        return buffer.slice(0, offset)
    }
}

/**
 * Creates a deserializer function for Structure of Arrays (SoA) data.
 * @param {ComponentRef[]} components - The components to deserialize.
 * @returns {Function} A function that deserializes the SoA data.
 */
export const createSoADeserializer = (components: (ComponentRef | PrimitiveBrand | TypedArray)[]) => {
    const componentDeserializers = components.map(createComponentDeserializer)
    return (packet: ArrayBuffer, entityIdMapping?: Map<number, number>): void => {
        const view = new DataView(packet)
        let offset = 0
        while (offset < packet.byteLength) {
            for (let i = 0; i < componentDeserializers.length; i++) {
                offset += componentDeserializers[i](view, offset, entityIdMapping)
            }
        }
    }
}
