export const defineHiddenProperty = (obj:any,key:any,value:any) => Object.defineProperty(obj, key, {
    value,
    enumerable: false,
    writable: true,
    configurable: true,
})

export const defineHiddenProperties = (obj:any,kv:any) => {
    const descriptors = {
        enumerable: false,
        writable: true,
        configurable: true,
    }
    Object.defineProperties(obj, Reflect.ownKeys(kv).reduce((a,k) => Object.assign(a, {[k]: {value: kv[k], ...descriptors}}), {}))
}