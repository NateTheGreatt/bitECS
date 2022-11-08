import { TYPES, TYPES_ENUM, TYPES_NAMES, UNSIGNED_MAX } from "./Constants.js";
import {
  ArrayStore,
  ComponentSchema,
  ComponentStore,
  StorageMetadata,
  Store,
  StoreType,
  TagStore,
  TypedArray,
  TypedArrayWithSymbols,
  TypeStore,
} from "./Types.js";
// import { createAllocator } from './Allocator.js'

const roundToMultiple = (mul: number) => (x: number) =>
  Math.ceil(x / mul) * mul;
const roundToMultiple4 = roundToMultiple(4);

export const $storeRef = Symbol("storeRef");
export const $storeSize = Symbol("storeSize");
export const $storeMaps = Symbol("storeMaps");
export const $storeFlattened = Symbol("storeFlattened");
export const $storeBase = Symbol("storeBase");
export const $storeType = Symbol("storeType");

export const $storeArrayElementCounts = Symbol("storeArrayElementCounts");
export const $storeSubarrays = Symbol("storeSubarrays");
export const $subarrayCursors = Symbol("subarrayCursors");
export const $subarray = Symbol("subarray");
export const $subarrayFrom = Symbol("subarrayFrom");
export const $subarrayTo = Symbol("subarrayTo");
export const $parentArray = Symbol("parentArray");
export const $tagStore = Symbol("tagStore");

export const $queryShadow = Symbol("queryShadow");
export const $serializeShadow = Symbol("serializeShadow");

export const $indexType = Symbol("indexType");
export const $indexBytes = Symbol("indexBytes");

export const $isEidType = Symbol("isEidType");

const stores: Record<symbol, ComponentStore | TagStore> = {};

// const alloc = createAllocator()

function isTypeStore(store: unknown): store is TypeStore {
  return ArrayBuffer.isView(store);
}

function isArrayStore(store: unknown): store is ArrayStore {
  return !ArrayBuffer.isView(store);
}

function isComponentStore(store: object): store is ComponentStore {
  return store.hasOwnProperty($storeFlattened);
}

export const resize = (ta: TypedArray, size: number) => {
  const newBuffer = new ArrayBuffer(size * ta.BYTES_PER_ELEMENT);
  // @ts-ignore
  const newTa = new ta.constructor(newBuffer);
  newTa.set(ta, 0);
  return newTa;
};

export const createShadow = (store: unknown, key: unknown) => {
  if (isArrayStore(store)) {
    const shadowStore = store[$parentArray].slice(0);
    store[key] = store.map((_, eid) => {
      const { length } = store[eid];
      const start = length * eid;
      const end = start + length;
      return shadowStore.subarray(start, end);
    });
  } else {
    store[key] = store.slice(0);
  }
};

const resizeSubarray = (
  metadata: StorageMetadata,
  store: ArrayStore,
  storeSize: number
) => {
  const cursors = metadata[$subarrayCursors];
  let type = store[$storeType];
  const length = store[0].length;
  const indexType =
    length <= UNSIGNED_MAX.uint8
      ? TYPES_ENUM.ui8
      : length <= UNSIGNED_MAX.uint16
      ? TYPES_ENUM.ui16
      : TYPES_ENUM.ui32;

  if (cursors[type] === 0) {
    const arrayElementCount = metadata[$storeArrayElementCounts][type];

    // // for threaded impl
    // // const summedBytesPerElement = Array(arrayCount).fill(0).reduce((a, p) => a + TYPES[type].BYTES_PER_ELEMENT, 0)
    // // const totalBytes = roundToMultiple4(summedBytesPerElement * summedLength * size)
    // // const buffer = new SharedArrayBuffer(totalBytes)

    const array = new TYPES[type](
      roundToMultiple4(arrayElementCount * storeSize)
    ) as TypedArrayWithSymbols;

    array.set(metadata[$storeSubarrays][type]!);

    metadata[$storeSubarrays][type] = array;

    array[$indexType] = TYPES_NAMES[indexType];
    array[$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
  }

  const start = cursors[type];
  const end = start + storeSize * length;
  cursors[type] = end;

  store[$parentArray] = metadata[$storeSubarrays][type]!.subarray(start, end);

  // pre-generate subarrays for each eid
  for (let eid = 0; eid < storeSize; eid++) {
    const start = length * eid;
    const end = start + length;
    store[eid] = store[$parentArray].subarray(
      start,
      end
    ) as TypedArrayWithSymbols;
    store[eid][$indexType] = TYPES_NAMES[indexType];
    store[eid][$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
    store[eid][$subarray] = true;
  }
};

const resizeRecursive = (
  metadata: ComponentStore,
  store: ComponentStore,
  size: number
) => {
  Object.keys(store).forEach((key) => {
    const ta = store[key] as unknown as TypeStore | ArrayStore | Store;
    if (isArrayStore(ta)) {
      resizeSubarray(metadata, ta, size);
      store[$storeFlattened].push(ta);
    } else if (isTypeStore(ta)) {
      store[key] = resize(ta, size);
      store[$storeFlattened].push(store[key] as unknown as TypeStore);
    } else if (typeof ta === "object") {
      resizeRecursive(metadata, ta as ComponentStore, size);
    }
  });
};

export const resizeStore = (store: ComponentStore | TagStore, size: number) => {
  if (!isComponentStore(store)) return;
  store[$storeSize] = size;
  store[$storeFlattened].length = 0;
  (Object.keys(store[$subarrayCursors]) as (keyof StoreType)[]).forEach((k) => {
    store[$subarrayCursors][k] = 0;
  });
  resizeRecursive(store, store, size);
};

export const resetStore = (store: ComponentStore | TagStore) => {
  if (isComponentStore(store)) {
    store[$storeFlattened].forEach((ta) => {
      if (isTypeStore(ta)) ta.fill(0);
      else ta.forEach((t) => t.fill(0));
    });
    const keys = Object.keys(store[$storeSubarrays]) as (keyof StoreType)[];
    keys.forEach((key) => store[$storeSubarrays][key]!.fill(0));
  }
};

export const resetStoreFor = (
  store: ComponentStore | TagStore,
  eid: number
) => {
  if (isComponentStore(store)) {
    store[$storeFlattened].forEach((ta) => {
      if (isTypeStore(ta)) ta[eid] = 0;
      else ta[eid].fill(0);
    });
  }
};

const createTypeStore = (type: keyof StoreType, length: number) => {
  const totalBytes = length * TYPES[type].BYTES_PER_ELEMENT;
  const buffer = new ArrayBuffer(totalBytes);
  const store = new TYPES[type](buffer) as TypeStore;
  store[$isEidType] = type === TYPES_ENUM.eid;
  return store;
};

export const parentArray = (store: ArrayStore) => store[$parentArray];

const createArrayStore = <TStoreType extends keyof StoreType>(
  metadata: StorageMetadata,
  type: TStoreType,
  length: number
) => {
  const storeSize = metadata[$storeSize];
  const store = new Array(storeSize).fill(0) as ArrayStore;
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
    ) as TypedArrayWithSymbols;
    array[$indexType] = TYPES_NAMES[indexType];
    array[$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;

    metadata[$storeSubarrays][type] = array as any;
  }

  const start = cursors[type];
  const end = start + storeSize * length;
  cursors[type] = end;

  store[$parentArray] = metadata[$storeSubarrays][type]!.subarray(start, end);

  // pre-generate subarrays for each eid
  for (let eid = 0; eid < storeSize; eid++) {
    const start = length * eid;
    const end = start + length;
    store[eid] = store[$parentArray].subarray(
      start,
      end
    ) as TypedArrayWithSymbols;
    store[eid][$indexType] = TYPES_NAMES[indexType];
    store[eid][$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
    store[eid][$subarray] = true;
  }

  return store;
};

const isArrayType = (x: unknown): x is [string, number] => {
  return (
    Array.isArray(x) && typeof x[0] === "string" && typeof x[1] === "number"
  );
};

export const createStore = <TComponentSchema extends ComponentSchema>(
  schema: TComponentSchema | undefined,
  size: number
): ComponentStore<ComponentSchema> | TagStore | undefined => {
  const $store = Symbol("store");

  if (schema === undefined || !Object.keys(schema).length) {
    // tag component
    stores[$store] = <TagStore>{
      [$storeSize]: size,
      [$tagStore]: true,
      [$storeBase]: () => stores[$store],
    };
    return stores[$store];
  }

  schema = JSON.parse(JSON.stringify(schema));

  const arrayElementCounts: Record<string, number> = {};
  const collectArrayElementCounts = (s: ComponentSchema) => {
    const keys = Object.keys(s);
    for (const k of keys) {
      const v = s[k];
      if (isArrayType(v)) {
        const type = v[0] as keyof StoreType;
        if (!arrayElementCounts[type]) arrayElementCounts[type] = 0;
        arrayElementCounts[type] += v[1];
      } else if (v instanceof Object) {
        collectArrayElementCounts(v as ComponentSchema);
      }
    }
  };
  collectArrayElementCounts(schema!);

  const metadata: StorageMetadata = {
    [$storeSize]: size,
    [$storeMaps]: {},
    [$storeSubarrays]: {},
    [$storeRef]: $store,
    [$subarrayCursors]: Object.keys(TYPES).reduce(
      (a, type) => ({ ...a, [type]: 0 }),
      {}
    ) as {
      [K in keyof StoreType]: number;
    },
    [$storeFlattened]: [],
    [$storeArrayElementCounts]: arrayElementCounts as Record<
      keyof StoreType,
      number
    >,
  };

  if (schema instanceof Object && Object.keys(schema).length) {
    const recursiveTransform = (a: any, k: string) => {
      if (typeof a[k] === "string") {
        a[k] = createTypeStore(a[k], size);
        a[k][$storeBase] = () => stores[$store];
        metadata[$storeFlattened].push(a[k]);
      } else if (isArrayType(a[k])) {
        const [type, length] = a[k] as [keyof StoreType, number];
        a[k] = createArrayStore(metadata, type, length);
        a[k][$storeBase] = () => stores[$store];
        metadata[$storeFlattened].push(a[k]);
        // Object.seal(a[k])
      } else if (a[k] instanceof Object) {
        a[k] = Object.keys(a[k]).reduce(recursiveTransform, a[k]) as Store;
        // Object.seal(a[k])
      }

      return a;
    };

    const componentStore = Object.assign(
      Object.keys(schema).reduce(recursiveTransform, schema),
      metadata
    );
    componentStore[$storeBase] = () => {
      return stores[$store] as ComponentStore<ComponentSchema>;
    };
    stores[$store] = componentStore;
    // Object.seal(stores[$store])

    return stores[$store];
  }
};

export const free = (store: ComponentStore) => {
  delete stores[store[$storeRef]];
};
