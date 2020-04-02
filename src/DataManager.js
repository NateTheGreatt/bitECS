// a DataManager takes an optional [schema] and creates a [typedarray of length n] per property

const primitives = {
    int8: Int8Array,
    uint8: Uint8Array,
    uint8clamped: Uint8ClampedArray,
    int16: Int16Array,
    uint16: Uint16Array,
    int32: Int32Array,
    uint32: Uint32Array,
    float32: Float32Array,
    float64: Float64Array,
    bigint64: BigInt64Array,
    biguint64: BigUint64Array
}

let currentBitflag = 1
export default (n, schema={}) => {
    const manager = {}
    manager.props = Object.keys(schema)
    manager.props.forEach(prop => {
        const type = schema[prop]
        const totalBytes = n * primitives[type].BYTES_PER_ELEMENT

        const buffer = new ArrayBuffer(totalBytes)

        manager[prop] = new primitives[type](buffer)
    })
    
    manager._bitflag = currentBitflag
    currentBitflag *= 2

    return manager
}