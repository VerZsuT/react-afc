import { getDispatch } from './getDispatch'

/**
 * Returns wrapped redux actions to use it without dispatcher
 */
export function useActions
<T extends { [key: string]: (arg: any) => any }>
(actions: T): T {
  const dispatch = getDispatch()
  const obj = {} as T

  for (const name in actions)
    obj[name] = ((arg: any) => dispatch(actions[name](arg))) as typeof actions[typeof name]

  return obj
}
