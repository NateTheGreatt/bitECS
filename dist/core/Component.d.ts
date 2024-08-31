import { Query } from './Query';
import { Observable } from './utils/Observer';
import { World } from './World';
export type ComponentRef = any;
export interface ComponentData {
    id: number;
    generationId: number;
    bitflag: number;
    ref: ComponentRef;
    queries: Set<Query>;
    setObservable: Observable;
}
export declare const registerComponent: (world: World, component: ComponentRef) => ComponentData;
export declare const registerComponents: (world: World, components: ComponentRef[]) => void;
export declare const hasComponent: (world: World, component: ComponentRef, eid: number) => boolean;
export declare const addComponent: (world: World, component: ComponentRef, eid: number) => void;
export declare const addComponents: (world: World, components: ComponentRef[], eid: number) => void;
export declare const removeComponent: (world: World, component: ComponentRef, eid: number) => void;
export declare const removeComponents: (world: World, components: ComponentRef[], eid: number) => void;
//# sourceMappingURL=Component.d.ts.map