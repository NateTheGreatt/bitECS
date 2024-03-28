# Data-oriented Serialization for SoA/AoA

A zero-dependency serialization library for data-oriented design structures like SoA (Structure of Arrays) and AoA (Array of Arrays).

## Features

- DataWriter: Serializes data from SoA object(s) to binary data provided array of indices to extract data from
- DataReader: Deserializes from binary data to SoA object(s) to the appropriate indices
- Binary data packed in an AoS-like format for optimal space efficiency
- ID mapping included for reading/writing data from/to different sets of indices
- Includes snapshot and delta modes
  - Snapshot mode serializes the entire state (default)
  - Delta mode only serializes state that has changed since the last serialization call

## Planned

- Support for AoA serialization
- More flexible API
  - Schemas
  - Ability to pass in ArrayBuffers to write to

## Example

```js
import assert from 'assert'
import { createDataWriter, createDataReader } from '@webecs/do-serialization'

/* SoA Object */

const n = 100

const Transform = {
  position: {
    x: new Float32Array(n),
    y: new Float32Array(n),
    z: new Float32Array(n),
  },
  rotation: {
    x: new Float32Array(n),
    y: new Float32Array(n),
    z: new Float32Array(n),
  },
}


/* Config */

// a simple array of SoA objects acts as the configuration
const config = [Transform]


/* Snapshot Mode */

// DataWriter and DataReader must have the same config in order to function correctly
const write = createDataWriter(config)
const read = createDataReader(config)

// initialize SoA state
const e = 0
Transform.position.x[e] = 1
Transform.position.y[e] = 2
Transform.position.z[e] = 3

// serialize
let data = write([e])

// reset SoA state
Transform.position.x[e] = 0
Transform.position.y[e] = 0
Transform.position.z[e] = 0

// deserialize
read(data)

// assert data was deserialized onto SoA state
assert(Transform.position.x[e] === 1) // true
assert(Transform.position.y[e] === 2) // true
assert(Transform.position.z[e] === 3) // true


/* Delta Mode */

// true value for second parameter enables delta mode (needed for both writer & reader)
const writeDeltas = createDataWriter(config, true)
const readDeltas = createDataReader(config, true)

Transform.position.x[e] = 0
Transform.position.y[e] = 0
Transform.position.z[e] = 0

// serialize
data = writeDeltas([e])

assert(data.byteLength === 0) // true, no changes made to the data

// mutate SoA state
Transform.position.x[e] = 1
Transform.position.y[e] = 2
Transform.position.z[e] = 3

// serialize
data = writeDeltas([e])

assert(data.byteLength > 0) // true, changes have been made to the data since the last call

// reset SoA state
Transform.position.x[e] = 0
Transform.position.y[e] = 0
Transform.position.z[e] = 0

// deserialize
readDeltas(data)

// assert changed data was deserialized onto SoA state
assert(Transform.position.x[e] === 1) // true
assert(Transform.position.y[e] === 2) // true
assert(Transform.position.z[e] === 3) // true


/* ID Mapping */

const idMap = new Map([[0,12]])

// this will write index 0 from the SoA object as index 12 in the binary data
data = write([e], idMap)


// this will read index 0 from the binary data to index 12 on the SoA object
read(data, idMap)

```
