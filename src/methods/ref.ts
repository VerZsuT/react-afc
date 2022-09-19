import { getForceUpdate } from '../lib'
import type { Ref } from '../types'

/**
 * Creates an object of the form `{ value: <ref_value> }`.
 *
 * When the `value` changes, the component is updated
 */
export function ref<T>(initial: T): Ref<T> {
  const forceUpdate = getForceUpdate()
  let value = initial

  return {
    get value(): T {
      return value
    },
    set value(newVal: T) {
      if (value === newVal) return
      value = newVal
      forceUpdate()
    }
  }
}
