type Func = (...args: any) => any;
export declare const pipe: <T extends Func, U extends Func, R extends Func>(...functions: [T, ...U[], R]) => (...args: Parameters<T>) => ReturnType<R>;
export {};
//# sourceMappingURL=pipe.d.ts.map