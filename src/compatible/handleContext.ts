import type { Context } from 'react'
import { useContext } from 'react'

import { isConstructing } from '../lib'
import { handleContext as incHandleContext } from '../methods/handleContext'

/**
 * _Compatible with non-afc components_
 *
 * Subscribes to context changes
 * @returns context getter
 */
export function handleContext<T>(context: Context<T>): () => T {
  if (isConstructing) {
    return incHandleContext<T>(context)
  }
  else {
    const value = useContext(context)
    return () => value
  }
}
