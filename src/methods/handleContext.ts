import type { Context } from 'react'
import { useContext } from 'react'

import { addToRenderAndCall } from '../lib'

/**
 * Subscribes to context changes
 * @returns context getter
 */
export function handleContext<T>(context: Context<T>): () => T {
  let value: T
  addToRenderAndCall(() => value = useContext(context))
  return () => value
}
