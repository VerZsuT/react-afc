import { useState } from 'react'

import { isConstructing } from '../lib'
import { ref as incRef } from '../methods/ref'
import type { Ref } from '../types'
import { onceCreated } from './onceCreated'

/**
 * _Compatible with non-afc components_
 *
 * Creates an object of the form `{ value: <ref_value> }`.
 *
 * When the `value` changes, the component is updated
 */
export function ref<T>(initial: T): Ref<T> {
  if (isConstructing) {
    return incRef<T>(initial)
  }
  else {
    const setState = useState<{}>()[1]

    return onceCreated(() => {
      let obj = initial

      return {
        get value(): T {
          return obj
        },
        set value(newVal: T) {
          if (obj === newVal) return
          obj = newVal
          setState({})
        }
      }
    })
  }
}
