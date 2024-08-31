import { World } from "./World";
import { ComponentRef } from './Component';
export declare const Prefab: {};
export declare const addPrefab: (world: World) => number;
export declare const addEntity: (world: World) => number;
export declare const removeEntity: (world: World, eid: number) => void;
export declare const getEntityComponents: (world: World, eid: number) => ComponentRef[];
export declare const entityExists: (world: World, eid: number) => boolean;
//# sourceMappingURL=Entity.d.ts.map