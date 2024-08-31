export type SparseSet = {
    add: (val: number) => void;
    remove: (val: number) => void;
    has: (val: number) => boolean;
    sparse: number[];
    dense: number[] | Uint32Array;
    reset: () => void;
};
export declare const createSparseSet: () => {
    add: (val: number) => void;
    remove: (val: number) => void;
    has: (val: number) => boolean;
    sparse: number[];
    dense: number[];
    reset: () => void;
};
export declare const createUint32SparseSet: (initialCapacity?: number) => SparseSet;
//# sourceMappingURL=SparseSet.d.ts.map