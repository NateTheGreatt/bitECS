/* globals SharedArrayBuffer */
export const Bitmask = (length, Type = Uint32Array) => {
  const bitsPerMask = Type.BYTES_PER_ELEMENT * 8
  const totalBytes = Math.ceil(length / bitsPerMask) * Type.BYTES_PER_ELEMENT
  const masks = new Type(new SharedArrayBuffer(totalBytes))

  const on = (i) => {
    const masksIndex = Math.floor(i / bitsPerMask)
    const index = i - bitsPerMask * masksIndex
    const bitflag = Math.pow(2, index)
    masks[masksIndex] |= bitflag
  }

  const off = (i) => {
    const masksIndex = Math.floor(i / bitsPerMask)
    const index = i - bitsPerMask * masksIndex
    const bitflag = Math.pow(2, index)
    masks[masksIndex] &= ~bitflag
  }

  const set = (i, v) => {
    if (v) on(i)
    else off(i)
  }

  const get = (i) => {
    const masksIndex = Math.floor(i / bitsPerMask)
    const index = i - bitsPerMask * masksIndex
    const bitflag = Math.pow(2, index)
    return ((bitflag & masks[masksIndex]) !== 0) ? 1 : 0
  }

  const toggle = (i) => {
    const masksIndex = Math.floor(i / bitsPerMask)
    const index = i - bitsPerMask * masksIndex
    const bitflag = Math.pow(2, index)
    masks[masksIndex] ^= bitflag
  }

  return {
    on,
    off,
    set,
    get,
    toggle
  }
}
