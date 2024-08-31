export type Observer = (entity: number, ...args: any[]) => void;
export interface Observable {
    subscribe: (observer: Observer) => () => void;
    notify: (entity: number, ...args: any[]) => void;
}
export declare const createObservable: () => Observable;
//# sourceMappingURL=Observer.d.ts.map