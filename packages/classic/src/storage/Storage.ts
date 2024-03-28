import {
  TYPES,
  TYPES_ENUM,
  TYPES_NAMES,
  UNSIGNED_MAX,
} from "../constants/Constants.js";
import { Constructor, TODO, TypedArray } from "../utils/types.js";
import {
  $indexBytes,
  $indexType,
  $isEidType,
  $parentArray,
  $storeArrayElementCounts,
  $storeBase,
  $storeFlattened,
  $storeMaps,
  $storeRef,
  $storeSize,
  $storeSubarrays,
  $storeType,
  $subarray,
  $subarrayCursors,
  $tagStore,
} from "./symbols.js";
import { Metadata, Schema } from "./types.js";

const roundToMultiple = (mul: number) => (x: number) =>
  Math.ceil(x / mul) * mul;
const roundToMultiple4 = roundToMultiple(4);

const stores: TODO = {};

export const resize = (typedArray: TypedArray, size: number) => {
  const newBuffer = new ArrayBuffer(size * typedArray.BYTES_PER_ELEMENT);
  const newTa = new (typedArray.constructor as Constructor)(newBuffer);
  newTa.set(typedArray, 0);
  return newTa;
};

export const createShadow = (store: TODO, key: string | number | symbol) => {
  if (!ArrayBuffer.isView(store)) {
    const shadowStore = store[$parentArray].slice(0);
    store[key] = store.map((_: any, eid: number) => {
      const { length } = store[eid];
      const start = length * eid;
      const end = start + length;
      return shadowStore.subarray(start, end);
    });
  } else {
    (store as TODO)[key] = (store as TypedArray).slice(0);
  }
};

const resizeSubarray = (metadata: Metadata, store: TODO, storeSize: number) => {
  const cursors = metadata[$subarrayCursors];
  let type = (store as TODO)[$storeType];
  const length = store[0].length;
  const indexType =
    length <= UNSIGNED_MAX.uint8
      ? TYPES_ENUM.ui8
      : length <= UNSIGNED_MAX.uint16
      ? TYPES_ENUM.ui16
      : TYPES_ENUM.ui32;

  if (cursors[type] === 0) {
    const arrayElementCount = metadata[$storeArrayElementCounts][type];

    // for threaded impl
    // const summedBytesPerElement = Array(arrayCount).fill(0).reduce((a, p) => a + TYPES[type].BYTES_PER_ELEMENT, 0)
    // const totalBytes = roundToMultiple4(summedBytesPerElement * summedLength * size)
    // const buffer = new SharedArrayBuffer(totalBytes)

    const array = new TYPES[type as keyof typeof TYPES](
      roundToMultiple4(arrayElementCount * storeSize)
    ) as TODO;

    array.set(metadata[$storeSubarrays][type]);

    metadata[$storeSubarrays][type] = array;

    array[$indexType] = TYPES_NAMES[indexType];
    array[$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
  }

  const start = cursors[type];
  const end = start + storeSize * length;
  cursors[type] = end;

  store[$parentArray] = metadata[$storeSubarrays][type].subarray(start, end);

  // pre-generate subarrays for each eid
  for (let eid = 0; eid < storeSize; eid++) {
    const start = length * eid;
    const end = start + length;
    store[eid] = store[$parentArray].subarray(start, end);
    store[eid][$indexType] = TYPES_NAMES[indexType];
    store[eid][$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
    store[eid][$subarray] = true;
  }
};

const resizeRecursive = (metadata: Metadata, store: TODO, size: number) => {
  Object.keys(store).forEach((key) => {
    const ta = store[key];
    if (Array.isArray(ta)) {
      resizeSubarray(metadata, ta, size);
      store[$storeFlattened].push(ta);
    } else if (ArrayBuffer.isView(ta)) {
      store[key] = resize(ta as TypedArray, size);
      store[$storeFlattened].push(store[key]);
    } else if (typeof ta === "object") {
      resizeRecursive(metadata, store[key], size);
    }
  });
};

export const resizeStore = (store: TODO, size: number) => {
  if (store[$tagStore]) return;
  store[$storeSize] = size;
  store[$storeFlattened].length = 0;
  Object.keys(store[$subarrayCursors]).forEach((k) => {
    store[$subarrayCursors][k] = 0;
  });
  resizeRecursive(store, store, size);
};

export const resetStore = (store: TODO) => {
  if (store[$storeFlattened]) {
    store[$storeFlattened].forEach((typedArray: TypedArray) => {
      typedArray.fill(0);
    });
    Object.keys(store[$storeSubarrays]).forEach((key) => {
      store[$storeSubarrays][key].fill(0);
    });
  }
};

export const resetStoreFor = (store: TODO, eid: number) => {
  if (store[$storeFlattened]) {
    store[$storeFlattened].forEach((typedArray: TypedArray) => {
      if (ArrayBuffer.isView(typedArray)) typedArray[eid] = 0;
      else (typedArray[eid] as TypedArray).fill(0);
    });
  }
};

const createTypeStore = (type: keyof typeof TYPES, length: number) => {
  const totalBytes = length * TYPES[type].BYTES_PER_ELEMENT;
  const buffer = new ArrayBuffer(totalBytes);
  const store = new TYPES[type](buffer);
  (store as TODO)[$isEidType] = type === TYPES_ENUM.eid;
  return store;
};

export const parentArray = (store: TODO) => store[$parentArray];

const createArrayStore = (
  metadata: Metadata,
  type: keyof typeof TYPES,
  length: number
) => {
  const storeSize = metadata[$storeSize];
  const store = Array(storeSize).fill(0) as TODO;
  store[$storeType] = type;
  store[$isEidType] = type === TYPES_ENUM.eid;

  const cursors = metadata[$subarrayCursors];
  const indexType =
    length <= UNSIGNED_MAX.uint8
      ? TYPES_ENUM.ui8
      : length <= UNSIGNED_MAX.uint16
      ? TYPES_ENUM.ui16
      : TYPES_ENUM.ui32;

  if (!length) throw new Error("bitECS - Must define component array length");
  if (!TYPES[type])
    throw new Error(`bitECS - Invalid component array property type ${type}`);

  // create buffer for type if it does not already exist
  if (!metadata[$storeSubarrays][type]) {
    const arrayElementCount = metadata[$storeArrayElementCounts][type];

    // for threaded impl
    // const summedBytesPerElement = Array(arrayCount).fill(0).reduce((a, p) => a + TYPES[type].BYTES_PER_ELEMENT, 0)
    // const totalBytes = roundToMultiple4(summedBytesPerElement * summedLength * size)
    // const buffer = new SharedArrayBuffer(totalBytes)

    const array = new TYPES[type](
      roundToMultiple4(arrayElementCount * storeSize)
    ) as TODO;
    array[$indexType] = TYPES_NAMES[indexType];
    array[$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;

    metadata[$storeSubarrays][type] = array;
  }

  const start = cursors[type];
  const end = start + storeSize * length;
  cursors[type] = end;

  store[$parentArray] = metadata[$storeSubarrays][type].subarray(start, end);

  // pre-generate subarrays for each eid
  for (let eid = 0; eid < storeSize; eid++) {
    const start = length * eid;
    const end = start + length;
    store[eid] = store[$parentArray].subarray(start, end);
    store[eid][$indexType] = TYPES_NAMES[indexType];
    store[eid][$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
    store[eid][$subarray] = true;
  }

  return store;
};

const isArrayType = (x: TODO) =>
  Array.isArray(x) && typeof x[0] === "string" && typeof x[1] === "number";

export const createStore = (schema: Schema, size: number) => {
  const $store = Symbol("store");

  if (!schema || !Object.keys(schema).length) {
    // tag component
    stores[$store] = {
      [$storeSize]: size,
      [$tagStore]: true,
      [$storeBase]: () => stores[$store],
    };
    return stores[$store];
  }

  schema = JSON.parse(JSON.stringify(schema));

  const arrayElementCounts: TODO = {};

  const collectArrayElementCounts = (s: TODO) => {
    const keys = Object.keys(s);
    for (const k of keys) {
      if (isArrayType(s[k])) {
        if (!arrayElementCounts[s[k][0]]) arrayElementCounts[s[k][0]] = 0;
        arrayElementCounts[s[k][0]] += s[k][1];
      } else if (s[k] instanceof Object) {
        collectArrayElementCounts(s[k]);
      }
    }
  };
  collectArrayElementCounts(schema);

  const metadata = {
    [$storeSize]: size,
    [$storeMaps]: {},
    [$storeSubarrays]: {},
    [$storeRef]: $store,
    [$subarrayCursors]: Object.keys(TYPES).reduce(
      (a, type) => ({ ...a, [type]: 0 }),
      {}
    ),
    [$storeFlattened]: [] as any[],
    [$storeArrayElementCounts]: arrayElementCounts,
  };

  if (schema instanceof Object && Object.keys(schema).length) {
    const recursiveTransform = (a: TODO, key: TODO) => {
      if (typeof a[key] === "string") {
        a[key] = createTypeStore(a[key], size);
        a[key][$storeBase] = () => stores[$store];
        metadata[$storeFlattened].push(a[key]);
      } else if (isArrayType(a[key])) {
        const [type, length] = a[key];
        a[key] = createArrayStore(metadata as Metadata, type, length);
        a[key][$storeBase] = () => stores[$store];
        metadata[$storeFlattened].push(a[key]);
        // Object.seal(a[k])
      } else if (a[key] instanceof Object) {
        a[key] = Object.keys(a[key]).reduce(recursiveTransform, a[key]);
        // Object.seal(a[k])
      }

      return a;
    };

    stores[$store] = Object.assign(
      Object.keys(schema).reduce(recursiveTransform, schema),
      metadata
    );
    stores[$store][$storeBase] = () => stores[$store];

    // Object.seal(stores[$store])

    return stores[$store];
  }
};

export const free = (store: TODO) => {
  delete stores[store[$storeRef]];
};
