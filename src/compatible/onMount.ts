import { useEffect } from 'react'

import { onMount as incOnMount } from '../methods/onMount'
import { isConstructing } from '../lib'

/**
 * _Compatible with non-afc components_
 *
 * Calls the function after mounting the component
 *
 * _Analog of `useEffect(callback, [])`_
 */
export function onMount(callback: () => void): void {
  if (isConstructing)
    incOnMount(callback)
  else
    useEffect(callback, [])
}
