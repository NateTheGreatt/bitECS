const $u8 = Symbol('u8'), $i8 = Symbol('i8'), $u16 = Symbol('u16'), $i16 = Symbol('i16'),
    $u32 = Symbol('u32'), $i32 = Symbol('i32'), $f32 = Symbol('f32'), $f64 = Symbol('f64')

export type TypedArray = 
    | Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

export type TypeSymbol = typeof $u8 | typeof $i8 | typeof $u16 | typeof $i16 | typeof $u32 | typeof $i32 | typeof $f32 | typeof $f64

export type PrimitiveBrand = (number[] & { [key: symbol]: true }) | TypedArray

const typeTagForSerialization = (symbol: TypeSymbol) => (a: number[] = []): PrimitiveBrand => 
    Object.defineProperty(a, symbol, { value: true, enumerable: false, writable: false, configurable: false }) as PrimitiveBrand

export const u8 = typeTagForSerialization($u8),     i8 = typeTagForSerialization($i8),
            u16 = typeTagForSerialization($u16),    i16 = typeTagForSerialization($i16),
            u32 = typeTagForSerialization($u32),    i32 = typeTagForSerialization($i32),
            f32 = typeTagForSerialization($f32),    f64 = typeTagForSerialization($f64)

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

export const createComponentSerializer = (component: Record<string, PrimitiveBrand>) => {
    const props = Object.keys(component)
    const types = props.map(prop => {
        const arr = component[prop]
        for (const symbol of [$u8, $i8, $u16, $i16, $u32, $i32, $f32, $f64]) {
            if (symbol in arr) return symbol
        }
        return $f64; // default to float64 if no type is specified
    })
    const setters = types.map(type => typeSetters[type as keyof typeof typeSetters] || (() => { throw new Error(`Unsupported or unannotated type`); }))
    return (view: DataView, offset: number, index: number) => {
        let bytesWritten = 0
        // Write index first
        bytesWritten += typeSetters[$u32](view, offset + bytesWritten, index)
        for (let i = 0; i < props.length; i++) {
            bytesWritten += setters[i](view, offset + bytesWritten, component[props[i]][index])
        }
        return bytesWritten
    }
}

export const createComponentDeserializer = (component: Record<string, PrimitiveBrand>) => {
    const props = Object.keys(component)
    const types = props.map(prop => {
        const arr = component[prop]
        for (const symbol of [$u8, $i8, $u16, $i16, $u32, $i32, $f32, $f64]) {
            if (symbol in arr) return symbol
        }
        return $f64; // default to float64 if no type is specified
    })
    const getters = types.map(type => typeGetters[type as keyof typeof typeGetters] || (() => { throw new Error(`Unsupported or unannotated type`); }))
    return (view: DataView, offset: number, entityIdMapping?: Map<number, number>) => {
        let bytesRead = 0

        const { value: originalIndex, size: indexSize } = typeGetters[$u32](view, offset + bytesRead)
        bytesRead += indexSize
        
        const index = entityIdMapping ? entityIdMapping.get(originalIndex) ?? originalIndex : originalIndex
        
        for (let i = 0; i < props.length; i++) {
            const { value, size } = getters[i](view, offset + bytesRead)
            component[props[i]][index] = value
            bytesRead += size
        }
        return bytesRead
    }
}

export const createSoASerializer = (components: Record<string, PrimitiveBrand>[], buffer: ArrayBuffer = new ArrayBuffer(1024 * 1024 * 100)) => {
    const view = new DataView(buffer)
    const componentSerializers = components.map(createComponentSerializer)
    return (indices: number[]): ArrayBuffer => {
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

export const createSoADeserializer = (components: Record<string, PrimitiveBrand>[]) => {
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
