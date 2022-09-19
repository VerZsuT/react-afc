import { useState } from 'react'

import { isConstructing } from '../lib'
import { createState as incCreateState } from '../methods/createState'
import type { StateReturns, StateSetters } from '../types'
import { onceCreated } from './onceCreated'

/**
 * _Compatible with non-afc components_
 *
 * Creates a state
 *
 * _Before applying the state changes, superficially compares the previous and new state_
 * @returns - {state, set<Key>}
 */
export function createState<T extends { [key: string]: any }>(initial: T): StateReturns<T> {
  if (isConstructing) {
    return incCreateState<T>(initial)
  }
  else {
    const setState = useState<{}>()[1]

    const [state, setters] = onceCreated(() => {
      const value = { ...initial }
      const obj = {} as StateSetters<T>
      for (const name in value) {
        obj[`set${name[0].toUpperCase()}${name.slice(1)}`] = (newValue: any) => {
          if (value[name] === newValue) return
          value[name] = newValue
          setState({})
        }
      }
      return [value, obj]
    })

    return {state, ...setters}
  }

}
