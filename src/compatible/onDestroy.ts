import { useEffect } from 'react'

import { isConstructing } from '../lib'
import { onDestroy as incOnDestroy } from '../methods/onDestroy'

/**
 * _Compatible with non-afc components_
 *
 * Calls the function after unmounting the component
 *
 * _Analog of `useEffect(() => callback, [])`_
 */
export function onDestroy(callback: () => void): void {
  if (isConstructing)
    incOnDestroy(callback)
  else
    useEffect(() => callback, [])
}
