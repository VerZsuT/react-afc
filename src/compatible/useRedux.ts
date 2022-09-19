import { useSelector } from 'react-redux'

import { isConstructing } from '../lib'
import { useRedux as incUseRedux } from '../methods/useRedux'

/**
 * _Compatible with non-afc components_
 *
 * Subscribes to redux-store changes and gets values depending on the passed configuration
 * @param config - object of the type `{key: selector}`
 */
export function useRedux
<T extends { [key: string]: (state: any) => any }>
(config: T) {
  if (isConstructing) {
    return incUseRedux<T>(config)
  }
  else {
    const state = {} as { [key in keyof T]: ReturnType<T[key]> }
    for (const name in config)
      state[name] = useSelector(config[name])
  
    return state
  }
}
