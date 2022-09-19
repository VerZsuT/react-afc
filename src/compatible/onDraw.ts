import { useLayoutEffect } from 'react'

import { isConstructing } from '../lib'
import { onDraw as incOnDraw } from '../methods/onDraw'

/**
 * _Compatible with non-afc components_
 *
 * Calls the function after drawing the component
 *
 * _Analog of `useLayoutEffect(callback, [])`_
 */
export function onDraw(callback: () => void): void {
  if (isConstructing)
    incOnDraw(callback)
  else
    useLayoutEffect(callback, [])
}
