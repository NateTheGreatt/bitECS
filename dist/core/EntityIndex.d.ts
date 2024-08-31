export type EntityIndex = {
    aliveCount: number;
    dense: number[];
    sparse: number[];
    maxId: number;
};
export declare const createEntityIndex: () => EntityIndex;
export declare const addEntityId: (index: EntityIndex) => number;
export declare const removeEntityId: (index: EntityIndex, id: number) => void;
export declare const isEntityIdAlive: (index: EntityIndex, id: number) => boolean;
//# sourceMappingURL=EntityIndex.d.ts.map