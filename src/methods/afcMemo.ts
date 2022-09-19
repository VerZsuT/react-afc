import { memo } from 'react'

import type { Constructor } from '../types'
import { afc } from './afc'

/**
 * Returns a memo component with constructor functionality
 */
export function afcMemo<P>(constructor: Constructor<P>) {
  return memo(afc(constructor))
}
