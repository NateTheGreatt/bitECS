type Func = (...args: any) => any
export const pipe = <T extends Func, U extends Func, R extends Func>
    (...functions: [T, ...U[], R]): ((...args: Parameters<T>) => ReturnType<R>) => {
    return (...args: Parameters<T>): ReturnType<R> => 
        functions.reduce((result, fn) => [fn(...result)], args as any)[0]
}
