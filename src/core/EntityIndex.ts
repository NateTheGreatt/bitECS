export type EntityIndex = {
    aliveCount: number
    dense: number[]
    sparse: number[]
    maxId: number
}

export const createEntityIndex = (): EntityIndex => ({
    aliveCount: 0,
    dense: [],
    sparse: [],
    maxId: 0,
})

export const addEntityId = (index: EntityIndex): number => {
    if (index.aliveCount < index.dense.length) {
        // Recycle id
        const recycledId = index.dense[index.aliveCount]
        index.sparse[recycledId] = index.aliveCount
        index.aliveCount++
        return recycledId
    }

    // Create new id
    const id = ++index.maxId
    index.dense.push(id)
    index.sparse[id] = index.aliveCount
    index.aliveCount++

    return id
}

export const removeEntityId = (index: EntityIndex, id: number): void => {
    const record = index.sparse[id]
    if (record === undefined || record >= index.aliveCount) {
        // Entity is not alive or doesn't exist, nothing to be done
        return
    }

    const denseIndex = record
    const lastIndex = index.aliveCount - 1
    const lastId = index.dense[lastIndex]

    // Swap with the last element
    index.sparse[lastId] = denseIndex
    index.dense[denseIndex] = lastId

    // Update the removed entity's record
    index.sparse[id] = index.dense.length
    index.dense[lastIndex] = id

    index.aliveCount--
}

export const isEntityIdAlive = (index: EntityIndex, id: number): boolean => {
    const record = index.sparse[id]
    return record !== undefined && index.dense[record] === id
}
