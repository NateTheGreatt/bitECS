import { EntityId } from "../Entity";
export type Observer = (entity: EntityId, ...args: any[]) => void | object;
export interface Observable {
    subscribe: (observer: Observer) => () => void;
    notify: (entity: EntityId, ...args: any[]) => void | object;
}
export declare const createObservable: () => Observable;
//# sourceMappingURL=Observer.d.ts.map