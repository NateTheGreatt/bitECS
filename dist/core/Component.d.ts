import { EntityId } from './Entity';
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
    getObservable: Observable;
}
export declare const registerComponent: (world: World, component: ComponentRef) => ComponentData;
export declare const registerComponents: (world: World, components: ComponentRef[]) => void;
export declare const hasComponent: (world: World, eid: EntityId, component: ComponentRef) => boolean;
export declare const getComponent: (world: World, eid: EntityId, component: ComponentRef) => any;
export declare const set: <T extends ComponentRef>(component: T, data: any) => {
    component: T;
    data: any;
};
type ComponentSetter<T = any> = {
    component: ComponentRef;
    data: T;
};
export declare const setComponent: (world: World, eid: EntityId, component: ComponentRef, data: any) => void;
export declare const addComponent: (world: World, eid: EntityId, componentOrSet: ComponentRef | ComponentSetter) => boolean;
export declare function addComponents(world: World, eid: EntityId, components: (ComponentRef | ComponentSetter)[]): void;
export declare function addComponents(world: World, eid: EntityId, ...components: (ComponentRef | ComponentSetter)[]): void;
export declare const removeComponent: (world: World, eid: EntityId, ...components: ComponentRef[]) => void;
export declare const removeComponents: (world: World, eid: EntityId, ...components: ComponentRef[]) => void;
export {};
//# sourceMappingURL=Component.d.ts.map