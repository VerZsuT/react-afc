import { useDispatch } from 'react-redux'

import { isConstructing } from '../lib'
import { useActions as incUseActions } from '../methods/useActions'
import { onceCreated } from './onceCreated'

/**
 * _Compatible with non-afc components_
 *
 * Returns wrapped redux actions to use it without dispatcher
 */
export function useActions
<T extends { [key: string]: (arg: any) => any }>
(actions: T): T {
  if (isConstructing) {
    return incUseActions<T>(actions)
  }
  else {
    const dispatch = useDispatch()
    return onceCreated(() => {
      const obj = {} as T
      for (const name in actions)
        obj[name] = ((arg: any) => dispatch(actions[name](arg))) as typeof actions[typeof name]

      return obj
    })
  }
}
