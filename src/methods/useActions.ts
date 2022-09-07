import type {Actions} from '../types'
import {getDispatcher} from './getDispatcher'

/**
 * Returns wrapped redux actions to use it without dispatcher
 */
export function useActions<T extends Actions = {}>(actions: T): T {
    const dispatch = getDispatcher()
    const obj = {} as T

    for (const name in actions)
        obj[name] = ((arg: any) => dispatch(actions[name](arg))) as typeof actions[typeof name]

    return obj
}
