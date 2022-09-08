import {getForceUpdate} from '../lib'

export function reactive<T extends {} = {}>(state: T): T {
    const forceUpdate = getForceUpdate()
    const value = {...state}
    const obj = {} as T

    for (const key in value) {
        Object.defineProperty(obj, key, {
            get(): T[typeof key] {
                return value[key]
            },
            set(newVal: any) {
                if (value[key] === newVal) return
                value[key] = newVal
                forceUpdate()
            }
        })
    }
    
    return obj
}
