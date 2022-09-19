import { useDispatch } from 'react-redux'
import type { AnyAction, Dispatch } from 'redux'

import { isConstructing } from '../lib'
import { getDispatch as incGetDispatch } from '../methods/getDispatch'

/**
 * _Compatible with non-afc components_
 *
 * Returns redux-dispatch
 */
export function getDispatch<T = Dispatch<AnyAction>>(): T {
  if (isConstructing)
    return incGetDispatch<T>()
  else
    return useDispatch() as T
}
