import { useState } from 'react'

import { isConstructing } from '../lib'
import { reactive as incReactive } from '../methods/reactive'
import { onceCreated } from './onceCreated'

/**
 * _Compatible with non-afc components_
 *
 * Returns reactive state.
 * Changes to the state will cause the component to be updated.
 */
export function reactive<T extends { [key: string]: any }>(state: T): T {
  if (isConstructing) {
    return incReactive<T>(state)
  }
  else {
    const setState = useState<{}>()[1]

    return onceCreated<T>(() => {
      const value = { ...state }
      const obj = {} as T
      for (const key in value) {
        Object.defineProperty(obj, key, {
          get: () => value[key],
          set(newValue: any) {
            if (value[key] === newValue) return
            value[key] = newValue
            setState({})
          },
          configurable: true,
          enumerable: true
        })
      }
      return obj
    })
  }
}
