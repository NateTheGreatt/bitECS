import {test,assert} from "vitest"
import { createTable, addTableRow, getTableRecord, setTableRecord } from "../../src/archetypes/table"

test('#createTable', () => {
  const schema = {
    ui8: Uint8Array,
    i8: Int8Array,
    ui16: Uint16Array,
    i16: Int16Array,
    ui32: Uint32Array,
    i32: Int32Array,
    f32: Float32Array,
    f64: Float64Array,
    nested: {
      ui8: Uint8Array
    }
  }
  const n = 10
  const table = createTable(schema, n)

  assert('ui8' in table)
  assert('i8' in table)
  assert('ui16' in table)
  assert('i16' in table)
  assert('ui32' in table)
  assert('i32' in table)
  assert('f32' in table)
  assert('f64' in table)
  assert('nested' in table)
  assert('ui8' in table.nested)
  
  assert(table.ui8 instanceof Uint8Array)
  assert(table.i8 instanceof Int8Array)
  assert(table.ui16 instanceof Uint16Array)
  assert(table.i16 instanceof Int16Array)
  assert(table.ui32 instanceof Uint32Array)
  assert(table.i32 instanceof Int32Array)
  assert(table.f32 instanceof Float32Array)
  assert(table.f64 instanceof Float64Array)
  assert(table.nested instanceof Object)
  assert(table.nested.ui8 instanceof Uint8Array)
  
  assert(table.ui8.length === n)
  assert(table.i8.length === n)
  assert(table.ui16.length === n)
  assert(table.i16.length === n)
  assert(table.ui32.length === n)
  assert(table.i32.length === n)
  assert(table.f32.length === n)
  assert(table.f64.length === n)
  assert(table.f64.length === n)
  assert(table.nested.ui8.length === n)
})
test('#getRecord', () => {
  const schema = {
    ui8: Uint8Array,
    nested: {
      ui8: Uint8Array
    }
  }
  const n = 10
  const table = createTable(schema, n)
  const index = addTableRow(table)

  table.ui8[0] = 1

  const record = getTableRecord(table, index)

  assert('ui8' in record)
  assert('nested' in record)
  assert('ui8' in record.nested)
  
  assert.strictEqual(record.ui8, 1)
  assert.strictEqual(record.nested.ui8, 0)
})
test('#setTableRecord', () => {
  const schema = {
    ui8: Uint8Array,
    nested: {
      ui8: Uint8Array
    }
  }
  const n = 10
  const table = createTable(schema, n)
  const index = addTableRow(table)

  setTableRecord(table, index, { ui8: 1, nested: { ui8: 2 } })

  const record = getTableRecord(table, index)

  assert('ui8' in record)
  assert('nested' in record)
  assert('ui8' in record.nested)
  
  assert.strictEqual(record.ui8, 1)
  assert.strictEqual(record.nested.ui8, 2)
})
