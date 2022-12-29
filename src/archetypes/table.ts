export type TypedArray =
  | Uint8Array
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array

export type TypedArrayConstructor =
  | Uint8ArrayConstructor
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor

export type ISchema = {
  [key: string]: TypedArrayConstructor | [TypedArrayConstructor, number] | ISchema
}

const $size = Symbol("size");
const $length = Symbol("length");
const $schema = Symbol("schema");
const $flat = Symbol("flat");

export type TableMetadata = {
  size: number
  length: number
  schema: ISchema
}

type TablePrivate = {
  [$size]: number
  [$length]: number
  [$schema]: ISchema
  [$flat]: TypedArray[]
}

export type Table<S extends ISchema> = TablePrivate & {
  [key in keyof S]: S[key] extends TypedArrayConstructor
    ? InstanceType<S[key]>
    : S[key] extends [infer RS, number]
      ? RS extends TypedArrayConstructor
        ? Array<InstanceType<RS>>
        : unknown
      : S[key] extends ISchema
        ? Table<S[key]>
        : unknown
}

export type Record<S extends ISchema> = {
  [key in keyof S]: S[key] extends TypedArrayConstructor
    ? number
    : S[key] extends ISchema 
      ? Record<S[key]> 
      : unknown
}

const { isArray } = Array
const parseArraySchema = (v, size) => Array(size)
  .fill(new v[0](size * v[1]))
  .map((s,i) => s.subarray(i * size, i * size + v[1]))

const isView = (v) => v.prototype?.constructor
const parseViewSchema = (v, size) => new (v as TypedArrayConstructor)(size)

export const flatten = (obj: any): (TypedArray)[] =>
  Object.keys(obj)
    .sort()
    .flatMap((p) => {
      if (!isArray(obj[p]) && !isView(obj[p])) {
        return flatten(obj[p])
      }
      return obj[p]
    })
    .flat()

export const createTable = <S extends ISchema, C extends Table<S>>(schema: S, size: number): C => {
  const table = Object
    .entries(schema)
    .reduce((a,[k,v]) => 
      Object.assign(a, {
        [k]: isArray(v)
          ? parseArraySchema(v, size)
          : isView(v)
            ? parseViewSchema(v, size)
            : createTable(v as ISchema, size)
      }),
    {} as C)

  table[$schema] = schema
  table[$size] = size
  table[$length] = 0
  table[$flat] = flatten(table)

  return table
}

export const cloneTable = <S extends ISchema>(table: Table<S>, size = table[$size]) => {
  return createTable(table[$schema], size)
}

export const addTableRow = <S extends ISchema>(table: Table<S>) => {
  const i = table[$length]++
  if (i > table[$size]) resize()
  return i
}

export const decrementTableLength = <S extends ISchema>(table: Table<S>) => {
  return table[$length]--
}

export const copyWithin = <S extends ISchema>(table: Table<S>, col: TypedArray, i: number, start: number, end: number = table[$length]) => col.copyWithin(i, start, end)

const removeCopy = <S extends ISchema>(table: Table<S>, col: TypedArray, i: number) => {
  decrementTableLength(table)
  return copyWithin(table, col, i, i+1)
}

const swapPop = <S extends ISchema>(table: Table<S>, col: TypedArray, i: number) => {
  const end = table[$length]

  // swap pop column data
  col[i] = col[end]
  col[end] = 0
  
  return table
}

export const removeTableRow = <S extends ISchema>(table: Table<S>, i: number, retainOrder = false) => {

  // TODO: optimize all other functions with flattened table
  for (const prop of table[$flat]) {
    if (retainOrder) {
      removeCopy(table, prop, i) 
    } else {
      swapPop(table, prop, i)
      decrementTableLength(table)
    }
  }

  // for (const colName in table) {
  //   if (ArrayBuffer.isView(table[colName])) retainOrder ? removeCopy(table, table[colName] as TypedArray, i) : swapPop(table, table[colName] as TypedArray, i)
  //   else {
  //     const innerTable = table[colName] as Table<ISchema>
  //     removeTableRow(innerTable, i, retainOrder)
  //   }
  // }
  return table
}

// todo: store all table data in one single underlying arraybuffer, formatted column-major, and then copy data from one table to another in a single copy
export const copyTableTo = <SA extends ISchema, SB extends ISchema>(tableFrom: Table<SA>, tableTo: Table<SB>, fromRow: number, toRow: number) => {

}

export const moveTableRowTo = <SA extends ISchema, SB extends ISchema>(tableFrom: Table<SA>, tableTo: Table<SB>, i: number, j = addTableRow(tableTo)) => {
  for (const colName in tableFrom) {
    if (ArrayBuffer.isView(tableFrom[colName])) {
      if (colName in tableTo) tableTo[colName][j] = tableFrom[colName][i]
      swapPop(tableFrom, tableFrom[colName] as TypedArray, i)
    } else {
      const innerTableFrom = tableFrom[colName] as Table<ISchema>
      const innerTableTo = tableFrom[colName] as Table<ISchema>
      moveTableRowTo(innerTableFrom, innerTableTo, i, j)
    }
  }
  
  decrementTableLength(tableFrom)

  return j
}

export const copyTableRowTo = <SA extends ISchema, SB extends ISchema>(tableFrom: Table<SA>, tableTo: Table<SB>, i: number, j: number = i) => {
  for (const colName in tableFrom) {
    if (ArrayBuffer.isView(tableFrom[colName])) colName in tableTo && (tableTo[colName][j] = tableFrom[colName][i]) 
    else {
      const innerTableFrom = tableFrom[colName] as Table<ISchema>
      const innerTableTo = tableFrom[colName] as Table<ISchema>
      copyTableRowTo(innerTableFrom, innerTableTo, i, j)
    }
  }
  return tableFrom
}

export const clearTableRow = <S extends ISchema>(table: Table<S>, i: number) => {
  for (const colName in table) {
    if (ArrayBuffer.isView(table[colName])) table[colName][i] = 0
    else {
      const innerTable = table[colName] as Table<ISchema>
      clearTableRow(innerTable, i)
    }
  }
  return table
}

export const setTableRecord = <S extends ISchema>(table: Table<S>, i: number, data: Record<S>) => {
  for (const colName in data) {
    const value = data[colName]
    if (ArrayBuffer.isView(table[colName])) table[colName][i] = value
    else {
      const innerTable = table[colName] as Table<ISchema>
      const innerData = data[colName] as Record<ISchema>
      setTableRecord(innerTable, i, innerData)
    }
  }
  return table
}

export const getTableRecord = <S extends ISchema>(table: Table<S>, i: number, out = {}): Record<S> => {
  const entries = Object.entries(table)

  for (const [colName, column] of entries) {
    if (ArrayBuffer.isView(column)) out[colName] = column[i]
    else {
      const innerTable = column as Table<ISchema>
      out[colName] = {}
      Object.assign(out[colName], getTableRecord(innerTable, i))
    }
  }

  return out as Record<S>
}

const _out: TableMetadata = { size: 0, length: 0, schema: undefined }
export const getTableMetadata =  <S extends ISchema>(table: Table<S>, out = _out): TableMetadata => {
  out.size = table[$size]
  out.length = table[$length]
  out.schema = table[$schema]
  return out
}


function resize() {
  throw new Error("Function not implemented.");
}