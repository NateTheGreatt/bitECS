import { strictEqual, deepEqual } from "assert"
import { test, describe, beforeEach } from "vitest"
import { 
    type ISpatialGrid,
    createSpatialGrid,
    spatialGridToCell,
    spatialGridIndexOf,
    spatialGridGetCell,
    spatialGridGetCellX,
    spatialGridGetCellY,
    spatialGridAdd,
    spatialGridRemove,
    spatialGridRefresh,
    spatialGridBroadphaseRadius,
    spatialGridBroadphasePosition,
    spatialGridBroadphaseView,
    spatialGridBroadphaseCell 
} from "./SpatialGrid"

describe("SpatialGrid", () => {
    let grid: ISpatialGrid
    
    beforeEach(() => {
        grid = createSpatialGrid({ cellsHigh: 10, cellsWide: 10, cellSize: 10 })
    })
    
    test("initialize correctly", () => {
        strictEqual(grid.cellSize, 10)
        strictEqual(spatialGridToCell(grid, 20), 2)
        strictEqual(spatialGridIndexOf(grid, 5, 5), 55)
        deepEqual(spatialGridGetCell(grid, 5, 5).dense, new Uint32Array([]))
        strictEqual(spatialGridGetCellX(grid, 5), 5)
        strictEqual(spatialGridGetCellY(grid, 5), 0)
    })
    
    test("add, remove, refresh", () => {
        const cellIndex = spatialGridAdd(grid, 10, 10, 1)
        deepEqual(spatialGridGetCell(grid, 1, 1).dense, new Uint32Array([1]))
        spatialGridRemove(grid, cellIndex, 1)
        deepEqual(spatialGridGetCell(grid, 1, 1).dense, new Uint32Array([]))
        spatialGridAdd(grid, 10, 10, 1)
        spatialGridRefresh(grid, 20, 20, cellIndex, 1)
        deepEqual(spatialGridGetCell(grid, 1, 1).dense, new Uint32Array([]))
        deepEqual(spatialGridGetCell(grid, 2, 2).dense, new Uint32Array([1]))
    })
    
    test("broadphaseRadius", () => {
        spatialGridAdd(grid, 10, 10, 1)
        spatialGridAdd(grid, 20, 20, 2)
        const ids = spatialGridBroadphaseRadius(grid, spatialGridIndexOf(grid, 1, 1), 3)
        deepEqual(ids, [1, 2])
    })
    
    test("broadphasePosition", () => {
        spatialGridAdd(grid, 10, 10, 1)
        spatialGridAdd(grid, 20, 20, 2)
        const ids = spatialGridBroadphasePosition(grid, 15, 15, 3)
        deepEqual(ids, [1, 2])
    })
    
    test("broadphaseView", () => {
        spatialGridAdd(grid, 10, 10, 1)
        spatialGridAdd(grid, 20, 20, 2)
        const ids = spatialGridBroadphaseView(grid, 15, 15, 3, 3)
        deepEqual(ids, [1, 2])
    })
    
    test("broadphaseCell", () => {
        spatialGridAdd(grid, 10, 10, 1)
        spatialGridAdd(grid, 20, 20, 2)
        const cells = spatialGridBroadphaseCell(grid, 15, 15, 3, 3)
        deepEqual(cells[0].dense, new Uint32Array([1]))
        deepEqual(cells[1].dense, new Uint32Array([2]))
    })
})