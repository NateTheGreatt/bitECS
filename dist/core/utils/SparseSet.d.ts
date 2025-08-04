export type SparseSet = {
    add: (val: number) => void;
    remove: (val: number) => void;
    has: (val: number) => boolean;
    sparse: number[];
    dense: number[] | Uint32Array;
    reset: () => void;
    sort: (compareFn?: (a: number, b: number) => number) => void;
};
export declare const createSparseSet: () => SparseSet;
export declare const createUint32SparseSet: (initialCapacity?: number) => SparseSet;
//# sourceMappingURL=SparseSet.d.ts.map