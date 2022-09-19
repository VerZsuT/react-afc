import { useMemo } from 'react'

import { isConstructing } from '../lib'
import { memoized as incMemoized } from '../methods/memoized'

/**
 * _Compatible with non-afc components_
 *
 * Returns the getter of the memoized value
 */
export function memoized<T>(factory: () => T, depsGetter: () => any[]): () => T {
  if (isConstructing) {
    return incMemoized<T>(factory, depsGetter)
  }
  else {
    const value = useMemo(factory, depsGetter())
    return () => value
  }
}
