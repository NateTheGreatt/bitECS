export type EntityIndex = {
    aliveCount: number;
    dense: number[];
    sparse: number[];
    maxId: number;
    versioning: boolean;
    versionBits: number;
    entityMask: number;
    versionShift: number;
    versionMask: number;
};
export declare const getId: (index: EntityIndex, id: number) => number;
export declare const getVersion: (index: EntityIndex, id: number) => number;
export declare const incrementVersion: (index: EntityIndex, id: number) => number;
export declare const createEntityIndex: (versioning?: boolean, versionBits?: number) => EntityIndex;
export declare const addEntityId: (index: EntityIndex) => number;
export declare const removeEntityId: (index: EntityIndex, id: number) => void;
export declare const isEntityIdAlive: (index: EntityIndex, id: number) => boolean;
//# sourceMappingURL=EntityIndex.d.ts.map