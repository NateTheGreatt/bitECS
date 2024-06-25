declare const $dense: unique symbol;
declare const $length: unique symbol;
declare const $buffer: unique symbol;
declare const $lengthBuffer: unique symbol;
declare const $maxCapacity: unique symbol;
declare const $onGrowCbs: unique symbol;

type OnGrowCallback = (params: {
    prevBuffer: SharedArrayBuffer | ArrayBuffer;
    newBuffer: SharedArrayBuffer | ArrayBuffer;
    prevSize: number;
    newSize: number;
    didGrowInPlace: boolean;
}) => void;
interface IUint32SparseSet {
    sparse: number[];
    dense: Uint32Array;
    [$dense]: Uint32Array;
    [$length]: number;
    [$buffer]: SharedArrayBuffer | ArrayBuffer;
    [$lengthBuffer]: SharedArrayBuffer | ArrayBuffer;
    [$maxCapacity]: number;
    [$onGrowCbs]: Set<OnGrowCallback>;
}
declare function createUint32SparseSet(initialCapacity: number, maxCapacity?: number): IUint32SparseSet;
declare function sparseSetAdd(sparseSet: IUint32SparseSet, value: number): void;
declare function sparseSetHas(sparseSet: IUint32SparseSet, value: number): boolean;
declare function sparseSetRemove(sparseSet: IUint32SparseSet, value: number): void;
declare function sparseSetGrow(sparseSet: IUint32SparseSet, newCapacity: number): void;
declare function sparseSetGetLength(sparseSet: IUint32SparseSet): number;
declare function sparseSetGetDense(sparseSet: IUint32SparseSet): Uint32Array;
declare function sparseSetOnGrow(sparseSet: IUint32SparseSet, cb: OnGrowCallback): () => boolean;

type Cell = IUint32SparseSet;
interface ISpatialGrid {
    cellSize: number;
    cells: Cell[];
    width: number;
    height: number;
    cellsWide: number;
    cellsHigh: number;
}
type SpatialGridBase = {
    cellSize: number;
    defaultCellLength?: number;
};
type SpatialGridOptionsGrid = {
    gridWidth: number;
    gridHeight: number;
};
type SpatialGridOptionsCell = {
    cellsHigh: number;
    cellsWide: number;
};
type SpatialGridOptions = SpatialGridBase & (SpatialGridOptionsCell | SpatialGridOptionsGrid);
declare function createSpatialGrid(options: SpatialGridOptions): ISpatialGrid;
declare function spatialGridToCell(grid: ISpatialGrid, xOrY: number): number;
declare function spatialGridIndexOf(grid: ISpatialGrid, cellX: number, cellY: number): number;
declare function spatialGridGetCell(grid: ISpatialGrid, x: number, y: number): Cell;
declare function spatialGridGetCellX(grid: ISpatialGrid, i: number): number;
declare function spatialGridGetCellY(grid: ISpatialGrid, i: number): number;
declare function spatialGridInBounds(grid: ISpatialGrid, x: number, y: number): boolean;
declare function spatialGridAdd(grid: ISpatialGrid, x: number, y: number, id: number): number;
declare function spatialGridRemove(grid: ISpatialGrid, cellIndex: number, id: number): void;
declare function spatialGridRefresh(grid: ISpatialGrid, x: number, y: number, cellIndex: number, id: number): number;
declare function spatialGridBroadphaseRadius(grid: ISpatialGrid, cellIndex: number, radius?: number): number[];
declare function spatialGridBroadphasePosition(grid: ISpatialGrid, x: number, y: number, r: number): number[];
declare function spatialGridBroadphaseView(grid: ISpatialGrid, x: number, y: number, cellsWide: number, cellsHigh: number): number[];
declare function spatialGridBroadphaseCell(grid: ISpatialGrid, x: number, y: number, cellsWide: number, cellsHigh: number): Cell[];

declare function isSabSupported(): boolean;

declare const SYMBOLS: {
    $dense: typeof $dense;
    $length: typeof $length;
    $buffer: typeof $buffer;
    $lengthBuffer: typeof $lengthBuffer;
    $maxCapacity: typeof $maxCapacity;
    $onGrowCbs: typeof $onGrowCbs;
};

export { type Cell, type ISpatialGrid, type IUint32SparseSet, SYMBOLS, createSpatialGrid, createUint32SparseSet, isSabSupported, sparseSetAdd, sparseSetGetDense, sparseSetGetLength, sparseSetGrow, sparseSetHas, sparseSetOnGrow, sparseSetRemove, spatialGridAdd, spatialGridBroadphaseCell, spatialGridBroadphasePosition, spatialGridBroadphaseRadius, spatialGridBroadphaseView, spatialGridGetCell, spatialGridGetCellX, spatialGridGetCellY, spatialGridInBounds, spatialGridIndexOf, spatialGridRefresh, spatialGridRemove, spatialGridToCell };
