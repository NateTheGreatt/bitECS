import { World } from "./World";
import { ComponentRef } from './Component';
export type EntityId = number;
export declare const Prefab: {};
export declare const addPrefab: (world: World) => EntityId;
export declare const addEntity: (world: World) => EntityId;
export declare const removeEntity: (world: World, eid: EntityId) => void;
export declare const getEntityComponents: (world: World, eid: EntityId) => ComponentRef[];
export declare const entityExists: (world: World, eid: EntityId) => boolean;
//# sourceMappingURL=Entity.d.ts.map