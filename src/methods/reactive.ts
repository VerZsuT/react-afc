import { getForceUpdate } from '../lib'

/**
 * Returns reactive state.
 * Changes to the state will cause the component to be updated.
 */
export function reactive<T extends { [key: string]: any }>(state: T): T {
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
      },
      configurable: true,
      enumerable: true
    })
  }

  return obj
}
