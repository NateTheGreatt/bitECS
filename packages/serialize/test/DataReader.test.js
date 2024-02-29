import { strictEqual } from 'assert'
import { createViewCursor, readProp, writeProp } from '../src/ViewCursor.js'
import { checkBitflag, createDataReader, readComponent, readComponentProp, readEntity } from '../src/DataReader.js'
import { createDataWriter, createEntityWriter, writeComponent, writeEntities, writeEntity } from '../src/DataWriter.js'

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


describe('AoS DataReader', () => {

  it('should checkBitflag', () => {
    const A = 2**0
    const B = 2**1
    const C = 2**2
    const mask = A | C
    strictEqual(checkBitflag(mask, A), true)
    strictEqual(checkBitflag(mask, B), false)
    strictEqual(checkBitflag(mask, C), true)
  })

  it('should readComponentProp', () => {
    const view = createViewCursor()
    const entity = 1

    const prop = Transform.position.x

    prop[entity] = 1.5

    writeProp(view, prop, entity)

    prop[entity] = 0

    view.cursor = 0

    readComponentProp(view, prop, entity)

    strictEqual(prop[entity], 1.5)
  })

  describe('snapshot mode', () => {

    it('should readComponent Transform.position', () => {
      const writePosition = writeComponent(Transform.position)

      const view = createViewCursor()
      const entity = 1
  
      const [x, y, z] = [1.5, 2.5, 3.5]
      Transform.position.x[entity] = x
      Transform.position.y[entity] = y
      Transform.position.z[entity] = z
  
      writePosition(view, entity)
  
      Transform.position.x[entity] = 0
      Transform.position.y[entity] = 0
      Transform.position.z[entity] = 0
  
      view.cursor = 0
  
      const readPosition = readComponent(Transform.position)
  
      readPosition(view, entity)
  
      strictEqual(Transform.position.x[entity], x)
      strictEqual(Transform.position.y[entity], y)
      strictEqual(Transform.position.z[entity], z)
  
      Transform.position.x[entity] = 10.5
      Transform.position.z[entity] = 11.5
  
      const rewind = view.cursor
  
      writePosition(view, entity)
  
      Transform.position.x[entity] = 5.5
      Transform.position.z[entity] = 6.5
  
      view.cursor = rewind
  
      readPosition(view, entity)
  
      strictEqual(Transform.position.x[entity], 10.5)
      strictEqual(Transform.position.y[entity], y)
      strictEqual(Transform.position.z[entity], 11.5)
    })

    it('should readEntity', () => {
      const componentReaders = [readComponent(Transform)]
      const componentWriters = [writeComponent(Transform)]

      const view = createViewCursor()
      const entity = 1

      const idMap = new Map([[entity,entity]])
      
      const [x, y, z] = [1.5, 2.5, 3.5]
      Transform.position.x[entity] = x
      Transform.position.y[entity] = y
      Transform.position.z[entity] = z
      Transform.rotation.x[entity] = x
      Transform.rotation.y[entity] = y
      Transform.rotation.z[entity] = z

      writeEntity(componentWriters)(view, entity)

      Transform.position.x[entity] = 0
      Transform.position.y[entity] = 0
      Transform.position.z[entity] = 0
      Transform.rotation.x[entity] = 0
      Transform.rotation.y[entity] = 0
      Transform.rotation.z[entity] = 0

      view.cursor = 0

      readEntity(componentReaders)(view, idMap)

      strictEqual(Transform.position.x[entity], x)
      strictEqual(Transform.position.y[entity], y)
      strictEqual(Transform.position.z[entity], z)
      strictEqual(Transform.rotation.x[entity], x)
      strictEqual(Transform.rotation.y[entity], y)
      strictEqual(Transform.rotation.z[entity], z)

      Transform.position.x[entity] = 0
      Transform.rotation.z[entity] = 0

      view.cursor = 0

      writeEntity(componentWriters)(view, entity)

      Transform.position.x[entity] = x
      Transform.rotation.z[entity] = z

      view.cursor = 0

      readEntity(componentReaders)(view, idMap)

      strictEqual(Transform.position.x[entity], 0)
      strictEqual(Transform.position.y[entity], y)
      strictEqual(Transform.position.z[entity], z)
      strictEqual(Transform.rotation.x[entity], x)
      strictEqual(Transform.rotation.y[entity], y)
      strictEqual(Transform.rotation.z[entity], 0)

    })

    it('should readEntities', () => {
      const view = createViewCursor()

      const idMap = new Map()

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
        idMap.set(entity, entity)
      })

      const entityWriter = createEntityWriter([Transform])
      writeEntities(entityWriter, view, entities)

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]

        strictEqual(Transform.position.x[entity], x)
        strictEqual(Transform.position.y[entity], y)
        strictEqual(Transform.position.z[entity], z)
        strictEqual(Transform.rotation.x[entity], x)
        strictEqual(Transform.rotation.y[entity], y)
        strictEqual(Transform.rotation.z[entity], z)
        
      }

    })

    it('should createDataReader', () => {
      const write = createDataWriter([Transform])

      const idMap = new Map()

      const n = 5
      const entities = Array(n).fill(0).map((_,i)=>i)
      entities

      const [x, y, z] = [1.5, 2.5, 3.5]

      entities.forEach(entity => {
        Transform.position.x[entity] = x
        Transform.position.y[entity] = y
        Transform.position.z[entity] = z
        Transform.rotation.x[entity] = x
        Transform.rotation.y[entity] = y
        Transform.rotation.z[entity] = z
        idMap.set(entity, entity)
      })

      const packet = write(entities)

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]

        Transform.position.x[entity] = 0
        Transform.position.y[entity] = 0
        Transform.position.z[entity] = 0
        Transform.rotation.x[entity] = 0
        Transform.rotation.y[entity] = 0
        Transform.rotation.z[entity] = 0
      }

      const read = createDataReader([Transform])

      read(packet, idMap)

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]
        strictEqual(Transform.position.x[entity], x)
        strictEqual(Transform.position.y[entity], y)
        strictEqual(Transform.position.z[entity], z)
        strictEqual(Transform.rotation.x[entity], x)
        strictEqual(Transform.rotation.y[entity], y)
        strictEqual(Transform.rotation.z[entity], z)
      }

    })
    
  })

  describe('delta mode', () => {

    it('should readComponent Transform.position', () => {
      const writePosition = writeComponent(Transform.position, true)
      const view = createViewCursor()
      const entity = 1
  
      const [x, y, z] = [1.5, 2.5, 3.5]
      Transform.position.x[entity] = x
      Transform.position.y[entity] = y
      Transform.position.z[entity] = z
  
      writePosition(view, entity)
  
      Transform.position.x[entity] = 0
      Transform.position.y[entity] = 0
      Transform.position.z[entity] = 0
  
      view.cursor = 0
  
      const readPosition = readComponent(Transform.position, true)
  
      readPosition(view, entity)
  
      strictEqual(Transform.position.x[entity], x)
      strictEqual(Transform.position.y[entity], y)
      strictEqual(Transform.position.z[entity], z)
  
      Transform.position.x[entity] = 10.5
      Transform.position.z[entity] = 11.5
  
      const rewind = view.cursor
  
      writePosition(view, entity)
  
      Transform.position.x[entity] = 5.5
      Transform.position.z[entity] = 6.5
  
      view.cursor = rewind
  
      readPosition(view, entity)
  
      strictEqual(Transform.position.x[entity], 10.5)
      strictEqual(Transform.position.y[entity], y)
      strictEqual(Transform.position.z[entity], 11.5)
    })

    it('should readEntity', () => {
      const componentReaders = [readComponent(Transform, true)]
      const componentWriters = [writeComponent(Transform, true)]
      const view = createViewCursor()
      const entity = 1

      const idMap = new Map([[entity,entity]])
      
      const [x, y, z] = [1.5, 2.5, 3.5]
      Transform.position.x[entity] = x
      Transform.position.y[entity] = y
      Transform.position.z[entity] = z
      Transform.rotation.x[entity] = x
      Transform.rotation.y[entity] = y
      Transform.rotation.z[entity] = z

      writeEntity(componentWriters, true)(view, entity)

      Transform.position.x[entity] = 0
      Transform.position.y[entity] = 0
      Transform.position.z[entity] = 0
      Transform.rotation.x[entity] = 0
      Transform.rotation.y[entity] = 0
      Transform.rotation.z[entity] = 0

      view.cursor = 0

      readEntity(componentReaders, true)(view, idMap)

      strictEqual(Transform.position.x[entity], x)
      strictEqual(Transform.position.y[entity], y)
      strictEqual(Transform.position.z[entity], z)
      strictEqual(Transform.rotation.x[entity], x)
      strictEqual(Transform.rotation.y[entity], y)
      strictEqual(Transform.rotation.z[entity], z)

      Transform.position.x[entity] = 0
      Transform.rotation.z[entity] = 0

      view.cursor = 0

      writeEntity(componentWriters, true)(view, entity)

      Transform.position.x[entity] = x
      Transform.rotation.z[entity] = z

      view.cursor = 0

      readEntity(componentReaders, true)(view, idMap)

      strictEqual(Transform.position.x[entity], 0)
      strictEqual(Transform.position.y[entity], y)
      strictEqual(Transform.position.z[entity], z)
      strictEqual(Transform.rotation.x[entity], x)
      strictEqual(Transform.rotation.y[entity], y)
      strictEqual(Transform.rotation.z[entity], 0)

    })

    it('should readEntities', () => {
      const view = createViewCursor()

      const idMap = new Map()

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
        idMap.set(entity, entity)
      })

      const entityWriter = createEntityWriter([Transform], true)
      writeEntities(entityWriter, view, entities)

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]

        strictEqual(Transform.position.x[entity], x)
        strictEqual(Transform.position.y[entity], y)
        strictEqual(Transform.position.z[entity], z)
        strictEqual(Transform.rotation.x[entity], x)
        strictEqual(Transform.rotation.y[entity], y)
        strictEqual(Transform.rotation.z[entity], z)
        
      }

    })

    it('should createDataReader', () => {
      const write = createDataWriter([Transform], true)

      const idMap = new Map()

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
        idMap.set(entity, entity)
      })

      const packet = write(entities)

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]

        Transform.position.x[entity] = 0
        Transform.position.y[entity] = 0
        Transform.position.z[entity] = 0
        Transform.rotation.x[entity] = 0
        Transform.rotation.y[entity] = 0
        Transform.rotation.z[entity] = 0
      }

      const read = createDataReader([Transform], true)

      read(packet, idMap)

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]
        strictEqual(Transform.position.x[entity], x)
        strictEqual(Transform.position.y[entity], y)
        strictEqual(Transform.position.z[entity], z)
        strictEqual(Transform.rotation.x[entity], x)
        strictEqual(Transform.rotation.y[entity], y)
        strictEqual(Transform.rotation.z[entity], z)
      }

    })

  })

})