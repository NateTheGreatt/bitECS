import assert, { strictEqual } from 'assert'
import { 
  createViewCursor,
  readFloat32,
  readProp,
  readUint16,
  readUint32,
  readUint8,
  sliceViewCursor,
  spaceUint16,
  spaceUint32,
  spaceUint8,
  writeFloat32,
  writeProp,
  writePropIfChanged,
  writeUint16,
  writeUint32,
  writeUint8
} from "../src/ViewCursor.js"

describe('ViewCursor read/write', () => {

  describe('ViewCursor', () => {

    it('should createViewCursor', () => {
      const view = createViewCursor()
      assert(view.hasOwnProperty('cursor'))
      strictEqual(view.cursor, 0)
      assert(view.hasOwnProperty('shadowMap'))
      assert(view.shadowMap instanceof Map)
    })

    it('should sliceViewCursor', () => {
      const view = createViewCursor()
      writeUint32(view, 32)
      strictEqual(sliceViewCursor(view).byteLength, 4)
      strictEqual(view.cursor, 0)
    })

  })

  describe('writers', () => {

    it('should writeProp', () => {
      const view = createViewCursor()
      const prop = new Float32Array(1)
      const entity = 0
      const val = 1.5
      prop[entity] = val
      writeProp(view, prop, 0)
      strictEqual(view.getFloat32(0), val)
    })

    it('should writePropIfChanged', () => {
      const view = createViewCursor()
      const prop = new Float32Array(1)
      const entity = 0
      const val = 1.5

      prop[entity] = val

      writePropIfChanged(view, prop, 0)
      strictEqual(view.getFloat32(0), val)

      writePropIfChanged(view, prop, 0)
      strictEqual(view.getFloat32(4), 0)

      prop[entity]++

      writePropIfChanged(view, prop, 0)
      strictEqual(view.getFloat32(4), val+1)
    })

    it('should writeFloat32', () => {
      const view = createViewCursor()
      const val = 1.5
      writeFloat32(view, val)
      strictEqual(view.cursor, Float32Array.BYTES_PER_ELEMENT)
      strictEqual(view.getFloat32(0), val)
    })

    it('should writeUint32', () => {
      const view = createViewCursor()
      const val = 12345678
      writeUint32(view, val)
      strictEqual(view.cursor, Uint32Array.BYTES_PER_ELEMENT)
      strictEqual(view.getUint32(0), val)
    })

    it('should writeUint16', () => {
      const view = createViewCursor()
      const val = 12345
      writeUint16(view, val)
      strictEqual(view.cursor, Uint16Array.BYTES_PER_ELEMENT)
      strictEqual(view.getUint16(0), val)
    })

    it('should writeUint8', () => {
      const view = createViewCursor()
      const val = 123
      writeUint8(view, val)
      strictEqual(view.cursor, Uint8Array.BYTES_PER_ELEMENT)
      strictEqual(view.getUint8(0), val)
    })

    it('should spaceUint32', () => {
      const view = createViewCursor()
      const val = 12345678
      const writeUint32 = spaceUint32(view)
      writeUint32(val)
      strictEqual(view.cursor, Uint32Array.BYTES_PER_ELEMENT)
      strictEqual(view.getUint32(0), val)
    })

    it('should spaceUint16', () => {
      const view = createViewCursor()
      const val = 12345
      const writeUint16 = spaceUint16(view)
      writeUint16(val)
      strictEqual(view.cursor, Uint16Array.BYTES_PER_ELEMENT)
      strictEqual(view.getUint16(0), val)
    })

    it('should spaceUint8', () => {
      const view = createViewCursor()
      const val = 123
      const writeUint8 = spaceUint8(view)
      writeUint8(val)
      strictEqual(view.cursor, Uint8Array.BYTES_PER_ELEMENT)
      strictEqual(view.getUint8(0), val)
    })

  })

  describe('readers', () => {

    it('should readProp', () => {
      const view = createViewCursor()
      const prop = new Float32Array(1)
      const val = 1.5
      view.setFloat32(0, val)
      strictEqual(readProp(view, prop), val)
    })

    it('should readFloat32', () => {
      const view = createViewCursor()
      const val = 1.5
      view.setFloat32(0, val)
      strictEqual(readFloat32(view), val)
    })

    it('should readUint32', () => {
      const view = createViewCursor()
      const val = 12345678
      view.setUint32(0, val)
      strictEqual(readUint32(view), val)
    })

    it('should readUint16', () => {
      const view = createViewCursor()
      const val = 12345
      view.setUint16(0, val)
      strictEqual(readUint16(view), val)
    })

    it('should readUint8', () => {
      const view = createViewCursor()
      const val = 123
      view.setUint8(0, val)
      strictEqual(readUint8(view), val)
    })

  })

})