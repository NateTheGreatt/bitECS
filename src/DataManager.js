// a DataManager takes an optional [schema] and creates a [typedarray of length n] per property

import {unrolledGet,unrolledSet} from './DataUnroller.js'

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

let globalBitflag = 1
const DataManager = (n, schema={}, base=true) => { 
    const manager = {}

    Object.defineProperty(manager, '_schema', {
        value: schema
    })

    Object.defineProperty(manager, '_props', {
        value: Object.keys(schema)
    })

    Object.keys(schema).forEach(prop => {
        if(typeof schema[prop] === 'object') {
            manager[prop] = DataManager(n, schema[prop], false)
        } else if(typeof schema[prop] === 'string') {
            const type = schema[prop].toLowerCase()
            const totalBytes = n * primitives[type].BYTES_PER_ELEMENT
            const buffer = new ArrayBuffer(totalBytes)
            manager[prop] = new primitives[type](buffer)
        } else {
            throw new Error(`bitECS Error: invalid property type ${schema[prop]}`)
        }
    })

    // recursively set all values to 0
    Object.defineProperty(manager, '_reset', {
        value: eid => {
            for(let prop of manager._props) {
                if(ArrayBuffer.isView(manager[prop]))
                    manager[prop][eid] = 0
                else if(manager[prop] instanceof Object)
                    manager[prop].clear(eid)
            }
        }
    })

    // recursively set all values from a supplied object
    Object.defineProperty(manager, '_set', {
        value: (eid, values) => {
            for(let prop in values) {
                if(ArrayBuffer.isView(manager[prop]))
                    manager[prop][eid] = values[prop]
                else if(typeof manager[prop] === 'object')
                    manager[prop].setValues(eid, values[prop])
            }
        }
    })

    // aggregate all typedarrays into single kvp array
    Object.defineProperty(manager, '_flatten', {
        value: (kvp = []) => {
            for(let prop of manager._props) {
                if(ArrayBuffer.isView(manager[prop])) {
                    kvp.push(manager[prop])
                } else if(typeof manager[prop] === 'object')
                    manager[prop]._flatten(kvp)
            }
            return kvp
        }
    })


    const flyweight = {}
    const get = unrolledGet(manager, flyweight)
    const set = unrolledSet(manager, flyweight)

    // return flyweight object
    Object.defineProperty(manager, 'get', {
        value: (eid) => get(eid)
    })
    Object.defineProperty(manager, 'set', {
        value: (eid) => set(eid)
    })

    Object.defineProperty(manager, '_bitflag', {
        value: BigInt(globalBitflag)
    })
    
    // only increment bitflag for the base object
    if(base) globalBitflag *= 2

    return manager
}

export default DataManager