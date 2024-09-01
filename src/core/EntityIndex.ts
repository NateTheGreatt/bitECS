/**
 * Represents the structure for managing entity IDs.
 */
export type EntityIndex = {
    /** The number of currently alive entities. */
    aliveCount: number
    /** Array of entity IDs, densely packed. */
    dense: number[]
    /** Sparse array mapping entity IDs to their index in the dense array. */
    sparse: number[]
    /** The highest entity ID that has been assigned. */
    maxId: number
}

/**
 * Creates and initializes a new EntityIndex.
 * @returns {EntityIndex} A new EntityIndex object.
 */
export const createEntityIndex = (): EntityIndex => ({
    aliveCount: 0,
    dense: [],
    sparse: [],
    maxId: 0,
})

/**
 * Adds a new entity ID to the index or recycles an existing one.
 * @param {EntityIndex} index - The EntityIndex to add to.
 * @returns {number} The new or recycled entity ID.
 */
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

/**
 * Removes an entity ID from the index.
 * @param {EntityIndex} index - The EntityIndex to remove from.
 * @param {number} id - The entity ID to remove.
 */
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

/**
 * Checks if an entity ID is currently alive in the index.
 * @param {EntityIndex} index - The EntityIndex to check.
 * @param {number} id - The entity ID to check.
 * @returns {boolean} True if the entity ID is alive, false otherwise.
 */
export const isEntityIdAlive = (index: EntityIndex, id: number): boolean => {
    const record = index.sparse[id]
    return record !== undefined && index.dense[record] === id
}
