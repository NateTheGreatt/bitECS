import { strictEqual } from 'assert'
import { createDataWriter, createEntityWriter, writeComponent, writeEntities, writeEntity } from '../src/DataWriter.js'
import { createViewCursor, readFloat32, readUint32, readUint8, sliceViewCursor } from '../src/ViewCursor.js'

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

describe('AoS DataWriter', () => {

  describe('snapshot mode', () => {
    
    it('should writeComponent', () => {
      const writeView = createViewCursor()
      const entity = 1

      const [x, y, z] = [1.5, 2.5, 3.5]
      Transform.position.x[entity] = x
      Transform.position.y[entity] = y
      Transform.position.z[entity] = z

      const writePosition = writeComponent(Transform.position)
      
      writePosition(writeView, entity)

      const testView = createViewCursor(writeView.buffer)

      strictEqual(writeView.cursor, 
        (3 * Float32Array.BYTES_PER_ELEMENT))

      strictEqual(readFloat32(testView), x)
      strictEqual(readFloat32(testView), y)
      strictEqual(readFloat32(testView), z)
    })

    it('should writeEntity', () => {
      const writeView = createViewCursor()
      const entity = 1
      
      const [x, y, z] = [1.5, 2.5, 3.5]
      Transform.position.x[entity] = x
      Transform.position.y[entity] = y
      Transform.position.z[entity] = z
      Transform.rotation.x[entity] = x
      Transform.rotation.y[entity] = y
      Transform.rotation.z[entity] = z

      writeEntity([writeComponent(Transform)])(writeView, entity)

      const readView = createViewCursor(writeView.buffer)

      strictEqual(writeView.cursor, 
        (1 * Uint32Array.BYTES_PER_ELEMENT) + 
        (6 * Float32Array.BYTES_PER_ELEMENT))
      
      strictEqual(readUint32(readView), 1)

      strictEqual(readFloat32(readView), x)
      strictEqual(readFloat32(readView), y)
      strictEqual(readFloat32(readView), z)
      strictEqual(readFloat32(readView), x)
      strictEqual(readFloat32(readView), y)
      strictEqual(readFloat32(readView), z)
    })
    
    it('should writeEntities', () => {
      const writeView = createViewCursor()

      const n = 5
      const entities = Array(n).fill(0).map((_,i)=>i)

      const [x, y, z] = [1.5, 2.5, 3.5]

      entities.forEach(entity => {
        Transform.position.x[entity] = x
        Transform.position.y[entity] = y
        Transform.position.z[entity] = z
        Transform.rotation.x[entity] = x
        Transform.rotation.y[entity] = y
        Transform.rotation.z[entity] = z
      })

      const entityWriter = createEntityWriter([Transform])

      const packet = writeEntities(entityWriter, writeView, entities)

      const expectedBytes = (1 * Uint32Array.BYTES_PER_ELEMENT) +
        n * (
          (1 * Uint32Array.BYTES_PER_ELEMENT) +
          (6 * Float32Array.BYTES_PER_ELEMENT)
        )

      strictEqual(writeView.cursor, 0)
      strictEqual(packet.byteLength, expectedBytes)
      
      const readView = createViewCursor(writeView.buffer)

      const count = readUint32(readView)
      strictEqual(count, entities.length)

      for (let i = 0; i < count; i++) {

        strictEqual(readUint32(readView), i)

        strictEqual(readFloat32(readView), x)
        strictEqual(readFloat32(readView), y)
        strictEqual(readFloat32(readView), z)
        strictEqual(readFloat32(readView), x)
        strictEqual(readFloat32(readView), y)
        strictEqual(readFloat32(readView), z)

      }

    })
    
    it('should createDataWriter', () => {
      const write = createDataWriter([Transform])

      const n = 50
      const entities = Array(n).fill(0).map((_,i)=>i)

      const [x, y, z] = [1.5, 2.5, 3.5]

      entities.forEach(entity => {
        Transform.position.x[entity] = x
        Transform.position.y[entity] = y
        Transform.position.z[entity] = z
        Transform.rotation.x[entity] = x
        Transform.rotation.y[entity] = y
        Transform.rotation.z[entity] = z
      })

      const packet = write(entities)

      const expectedBytes = (1 * Uint32Array.BYTES_PER_ELEMENT) +
        n * (
          (1 * Uint32Array.BYTES_PER_ELEMENT) +
          (6 * Float32Array.BYTES_PER_ELEMENT)
        )

      strictEqual(packet.byteLength, expectedBytes)
      
      const readView = createViewCursor(packet)

      const count = readUint32(readView)
      strictEqual(count, entities.length)

      for (let i = 0; i < count; i++) {

        strictEqual(readUint32(readView), i)

        strictEqual(readFloat32(readView), x)
        strictEqual(readFloat32(readView), y)
        strictEqual(readFloat32(readView), z)
        strictEqual(readFloat32(readView), x)
        strictEqual(readFloat32(readView), y)
        strictEqual(readFloat32(readView), z)

      }

    })

  })

  describe('delta mode', () => {

    it('should writeComponent', () => {
      const writeView = createViewCursor()
      const entity = 1

      const [x, y, z] = [1.5, 2.5, 3.5]
      Transform.position.x[entity] = x
      Transform.position.y[entity] = y
      Transform.position.z[entity] = z

      const writePosition = writeComponent(Transform.position, true)
      
      writePosition(writeView, entity)

      const testView = createViewCursor(writeView.buffer)

      strictEqual(writeView.cursor, 
        (1 * Uint8Array.BYTES_PER_ELEMENT) + 
        (3 * Float32Array.BYTES_PER_ELEMENT))

      strictEqual(readUint8(testView), 0b111)
      strictEqual(readFloat32(testView), x)
      strictEqual(readFloat32(testView), y)
      strictEqual(readFloat32(testView), z)
      
      sliceViewCursor(writeView)

      Transform.position.x[entity]++
      Transform.position.z[entity]++

      writePosition(writeView, entity)

      const readView = createViewCursor(writeView.buffer)

      strictEqual(writeView.cursor, 
        (1 * Uint8Array.BYTES_PER_ELEMENT) + 
        (2 * Float32Array.BYTES_PER_ELEMENT))

      strictEqual(readUint8(readView), 0b101)
      strictEqual(readFloat32(readView), x+1)
      strictEqual(readFloat32(readView), z+1)
    })

    it('should writeEntity', () => {
      const writeView = createViewCursor()
      const entity = 1
      
      const [x, y, z] = [1.5, 2.5, 3.5]
      Transform.position.x[entity] = x
      Transform.position.y[entity] = y
      Transform.position.z[entity] = z
      Transform.rotation.x[entity] = x
      Transform.rotation.y[entity] = y
      Transform.rotation.z[entity] = z

      writeEntity([writeComponent(Transform, true)], true)(writeView, entity)

      const readView = createViewCursor(writeView.buffer)

      strictEqual(writeView.cursor, 
        (1 * Uint32Array.BYTES_PER_ELEMENT) + 
        (2 * Uint8Array.BYTES_PER_ELEMENT) + 
        (6 * Float32Array.BYTES_PER_ELEMENT))
      
      strictEqual(readUint32(readView), 1)

      strictEqual(readUint8(readView), 0b1)

      strictEqual(readUint8(readView), 0b111111)
      strictEqual(readFloat32(readView), x)
      strictEqual(readFloat32(readView), y)
      strictEqual(readFloat32(readView), z)
      strictEqual(readFloat32(readView), x)
      strictEqual(readFloat32(readView), y)
      strictEqual(readFloat32(readView), z)
    })
    
    it('should writeEntities', () => {
      const writeView = createViewCursor()

      const n = 5
      const entities = Array(n).fill(0).map((_,i)=>i)

      const [x, y, z] = [1.5, 2.5, 3.5]

      entities.forEach(entity => {
        Transform.position.x[entity] = x
        Transform.position.y[entity] = y
        Transform.position.z[entity] = z
        Transform.rotation.x[entity] = x
        Transform.rotation.y[entity] = y
        Transform.rotation.z[entity] = z
      })

      const entityWriter = createEntityWriter([Transform], true)

      const packet = writeEntities(entityWriter, writeView, entities)

      const expectedBytes = (1 * Uint32Array.BYTES_PER_ELEMENT) +
        n * (
          (1 * Uint32Array.BYTES_PER_ELEMENT) +
          (2 * Uint8Array.BYTES_PER_ELEMENT) + 
          (6 * Float32Array.BYTES_PER_ELEMENT)
        )

      strictEqual(writeView.cursor, 0)
      strictEqual(packet.byteLength, expectedBytes)
      
      const readView = createViewCursor(writeView.buffer)

      const count = readUint32(readView)
      strictEqual(count, entities.length)

      for (let i = 0; i < count; i++) {

        strictEqual(readUint32(readView), i)

        strictEqual(readUint8(readView), 0b1)

        strictEqual(readUint8(readView), 0b111111)
        strictEqual(readFloat32(readView), x)
        strictEqual(readFloat32(readView), y)
        strictEqual(readFloat32(readView), z)
        strictEqual(readFloat32(readView), x)
        strictEqual(readFloat32(readView), y)
        strictEqual(readFloat32(readView), z)

      }

    })
    
    it('should createDataWriter', () => {
      const write = createDataWriter([Transform], true)

      const n = 50
      const entities = Array(n).fill(0).map((_,i)=>i)

      const [x, y, z] = [1.5, 2.5, 3.5]

      entities.forEach(entity => {
        Transform.position.x[entity] = x
        Transform.position.y[entity] = y
        Transform.position.z[entity] = z
        Transform.rotation.x[entity] = x
        Transform.rotation.y[entity] = y
        Transform.rotation.z[entity] = z
      })

      const packet = write(entities)

      const expectedBytes = (1 * Uint32Array.BYTES_PER_ELEMENT) +
        n * (
          (1 * Uint32Array.BYTES_PER_ELEMENT) +
          (2 * Uint8Array.BYTES_PER_ELEMENT) + 
          (6 * Float32Array.BYTES_PER_ELEMENT)
        )

      strictEqual(packet.byteLength, expectedBytes)
      
      const readView = createViewCursor(packet)

      const count = readUint32(readView)
      strictEqual(count, entities.length)

      for (let i = 0; i < count; i++) {

        strictEqual(readUint32(readView), i)

        strictEqual(readUint8(readView), 0b1)

        strictEqual(readUint8(readView), 0b111111)
        strictEqual(readFloat32(readView), x)
        strictEqual(readFloat32(readView), y)
        strictEqual(readFloat32(readView), z)
        strictEqual(readFloat32(readView), x)
        strictEqual(readFloat32(readView), y)
        strictEqual(readFloat32(readView), z)

      }

    })

  })

})