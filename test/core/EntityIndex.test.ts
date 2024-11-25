import { describe, it, expect } from 'vitest'
import { addEntityId, removeEntityId, isEntityIdAlive, createEntityIndex, getVersion, getId, withVersioning } from '../../src/core/EntityIndex'

describe('EntityIndex', () => {
    it('should add and remove entity IDs correctly', () => {
        const index = createEntityIndex()

        const id1 = addEntityId(index)
        const id2 = addEntityId(index)
        const id3 = addEntityId(index)

        expect(id1).toBe(1)
        expect(id2).toBe(2)
        expect(id3).toBe(3)

        removeEntityId(index, id2)
        expect(isEntityIdAlive(index, id2)).toBe(false)

        const id4 = addEntityId(index)
        expect(id4).toBe(id2)
        expect(isEntityIdAlive(index, id4)).toBe(true)
    })

    it('should recycle entity IDs correctly', () => {
        const index = createEntityIndex()

        const id1 = addEntityId(index)
        const id2 = addEntityId(index)
        removeEntityId(index, id1)
        removeEntityId(index, id2)

        const id3 = addEntityId(index)
        const id4 = addEntityId(index)

        expect(id3).toBe(id2)
        expect(id4).toBe(id1)

        removeEntityId(index, id3)
        removeEntityId(index, id4)
    })

    it('should handle versioning of recycled IDs', () => {
        const index = createEntityIndex(withVersioning())

        const id1 = addEntityId(index)
        removeEntityId(index, id1)

        const id2 = addEntityId(index)
        expect(id2).not.toBe(id1)
        expect(getVersion(index, id2)).toBe(1) // Use getVersion to check the version
    })

    it('should correctly identify alive and dead entity IDs', () => {
        const index = createEntityIndex()

        const id1 = addEntityId(index)
        const id2 = addEntityId(index)
        removeEntityId(index, id1)

        expect(isEntityIdAlive(index, id1)).toBe(false)
        expect(isEntityIdAlive(index, id2)).toBe(true)
    })

    it('should add and identify entity IDs with versioning', () => {
        const indexWithVersioning = createEntityIndex(withVersioning())

        const id5 = addEntityId(indexWithVersioning)
        const id6 = addEntityId(indexWithVersioning)
        const id7 = addEntityId(indexWithVersioning)

        expect(isEntityIdAlive(indexWithVersioning, id5)).toBe(true)
        expect(isEntityIdAlive(indexWithVersioning, id6)).toBe(true)
        expect(isEntityIdAlive(indexWithVersioning, id7)).toBe(true)
    })

    it('should remove and recycle entity IDs with versioning', () => {
        const indexWithVersioning = createEntityIndex(withVersioning())

        const id6 = addEntityId(indexWithVersioning)
        removeEntityId(indexWithVersioning, id6)

        expect(isEntityIdAlive(indexWithVersioning, id6)).toBe(false)

        const id8 = addEntityId(indexWithVersioning)
        expect(id8).not.toBe(id6) // Recycled ID with new version
        expect(id8 & 0xFFFF).toBe(1)
        expect(isEntityIdAlive(indexWithVersioning, id8)).toBe(true)
    })

    it('should correctly handle entity ID and version', () => {
        const index = createEntityIndex(withVersioning())

        // Add and remove entities to ensure versioning is applied
        const id1 = addEntityId(index)
        removeEntityId(index, id1)
        const id2 = addEntityId(index)
        removeEntityId(index, id2)
        const id3 = addEntityId(index)

        // Extract ID parts
        const entityId1 = getId(index, id1)
        const entityId2 = getId(index, id2)
        const entityId3 = getId(index, id3)

        const version1 = getVersion(index, id1)
        const version2 = getVersion(index, id2)
        const version3 = getVersion(index, id3)

        // Assert on entity ID and version
        expect(entityId1).toBe(1)
        expect(entityId2).toBe(1)
        expect(entityId3).toBe(1)

        expect(version1).toBe(0)
        expect(version2).toBe(1)
        expect(version3).toBe(2)
    })
    it('should handle versioning with 4 bits', () => {
        const index = createEntityIndex(withVersioning(4))
        const maxVersion = 15 // 2^4 - 1
        
        let id = addEntityId(index)
        removeEntityId(index, id)

        for (let i = 0; i < maxVersion; i++) {
            id = addEntityId(index)
            removeEntityId(index, id)
            expect(getVersion(index, id)).toBe(i+1)
        }
    
        expect(getVersion(index, id)).toBe(maxVersion)
    
        // Next removal and addition should wrap around to version 0
        removeEntityId(index, id)
        id = addEntityId(index)
        expect(getVersion(index, id)).toBe(0)
    
        // One more cycle to ensure it continues working
        removeEntityId(index, id)
        id = addEntityId(index)
        expect(getVersion(index, id)).toBe(1)
    })

    it('should handle versioning with 16 bits', () => {
        const index = createEntityIndex(withVersioning(16))
        const maxVersion = 65535 // 2^16 - 1

        let id = addEntityId(index)
        for (let i = 0; i < maxVersion; i++) {
            removeEntityId(index, id)
            id = addEntityId(index)
        }

        expect(getVersion(index, id)).toBe(maxVersion)

        // Next removal and addition should wrap around to version 0
        removeEntityId(index, id)
        id = addEntityId(index)
        expect(getVersion(index, id)).toBe(0)
    })
})