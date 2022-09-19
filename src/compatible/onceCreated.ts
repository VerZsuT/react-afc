import { useRef } from 'react'

import { isConstructing } from '../lib'

/**
 * _Compatible with non-afc components_
 *
 * Ensures that the value of the variable will be calculated **once** in _afc_ and _non-afc_ components
 */
export function onceCreated<T>(factory: () => T): T {
  if (isConstructing) {
    return factory()
  }
  else {
    const ref = useRef({
      isCreated: false,
      value: null as T
    })
    
    if (!ref.current.isCreated) {
      ref.current = {
        isCreated: true,
        value: factory()
      }
    }
    
    return ref.current.value
  }
}
