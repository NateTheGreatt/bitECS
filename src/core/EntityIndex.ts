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
    /** Flag indicating if versioning is enabled. */
    versioning: boolean
    /** Number of bits used for versioning. */
    versionBits: number
    /** Bit mask for entity ID. */
    entityMask: number
    /** Bit shift for version. */
    versionShift: number
    /** Bit mask for version. */
    versionMask: number
}

/**
 * Extracts the entity ID from a versioned entity ID by stripping off the version.
 * @param {EntityIndex} index - The EntityIndex containing the masks.
 * @param {number} id - The versioned entity ID.
 * @returns {number} The entity ID without the version.
 */
export const getId = (index: EntityIndex, id: number): number => id & index.entityMask;

/**
 * Extracts the version from an entity ID.
 * @param {EntityIndex} index - The EntityIndex containing the masks and shifts.
 * @param {number} id - The entity ID.
 * @returns {number} The version.
 */
export const getVersion = (index: EntityIndex, id: number): number => 
    (id >>> index.versionShift) & ((1 << index.versionBits) - 1);

/**
 * Increments the version of an entity ID.
 * @param {EntityIndex} index - The EntityIndex containing the masks and shifts.
 * @param {number} id - The entity ID.
 * @returns {number} The new entity ID with incremented version.
 */
export const incrementVersion = (index: EntityIndex, id: number): number => {
    const currentVersion = getVersion(index, id);
    const newVersion = (currentVersion + 1) & ((1 << index.versionBits) - 1);
    return (id & index.entityMask) | (newVersion << index.versionShift);
}

/**
 * Creates and initializes a new EntityIndex.
 * @param {boolean} versioning - Optional flag to enable versioning for recycled IDs.
 * @param {number} versionBits - Optional number of bits to use for versioning (default: 8).
 * @returns {EntityIndex} A new EntityIndex object.
 */
export const createEntityIndex = (versioning: boolean = false, versionBits: number = 8): EntityIndex => {
    const entityBits = 32 - versionBits
    const entityMask = (1 << entityBits) - 1
    const versionShift = entityBits
    const versionMask = ((1 << versionBits) - 1) << versionShift

    return {
        aliveCount: 0,
        dense: [],
        sparse: [],
        maxId: 0,
        versioning,
        versionBits,
        entityMask,
        versionShift,
        versionMask
    }
}

/**
 * Adds a new entity ID to the index or recycles an existing one.
 * @param {EntityIndex} index - The EntityIndex to add to.
 * @returns {number} The new or recycled entity ID.
 */
export const addEntityId = (index: EntityIndex): number => {
    if (index.aliveCount < index.dense.length) {
        // Recycle id
        const recycledId = index.dense[index.aliveCount];
        const entityId = recycledId;
        index.sparse[entityId] = index.aliveCount;
        index.aliveCount++;
        return recycledId;
    }

    // Create new id
    const id = ++index.maxId;
    index.dense.push(id);
    index.sparse[id] = index.aliveCount;
    index.aliveCount++;

    return id;
}

/**
 * Removes an entity ID from the index.
 * @param {EntityIndex} index - The EntityIndex to remove from.
 * @param {number} id - The entity ID to remove.
 */
export const removeEntityId = (index: EntityIndex, id: number): void => {
    const denseIndex = index.sparse[id];
    if (denseIndex === undefined || denseIndex >= index.aliveCount) {
        // Entity is not alive or doesn't exist, nothing to be done
        return;
    }

    const lastIndex = index.aliveCount - 1;
    const lastId = index.dense[lastIndex];

    // Swap with the last element
    index.sparse[lastId] = denseIndex;
    index.dense[denseIndex] = lastId;

    // Update the removed entity's record
    index.sparse[id] = lastIndex; // Set to lastIndex instead of undefined
    index.dense[lastIndex] = id; // Keep the original id, don't strip version

    // Version the ID if enabled
    if (index.versioning) {
        const newId = incrementVersion(index, id);
        index.dense[lastIndex] = newId;
    }

    index.aliveCount--;
}

/**
 * Checks if an entity ID is currently alive in the index.
 * @param {EntityIndex} index - The EntityIndex to check.
 * @param {number} id - The entity ID to check.
 * @returns {boolean} True if the entity ID is alive, false otherwise.
 */
export const isEntityIdAlive = (index: EntityIndex, id: number): boolean => {
    const entityId = getId(index, id);
    const denseIndex = index.sparse[entityId];
    return denseIndex !== undefined && denseIndex < index.aliveCount && index.dense[denseIndex] === id;
}
