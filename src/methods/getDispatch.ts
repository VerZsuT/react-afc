import {useDispatch} from 'react-redux'
import type {AnyAction, Dispatch} from 'redux'

import {addToRenderAndCall, currentData} from '../lib'

/**
 * @deprecated use `getDispatch` instead
 */
export const getDispatcher = getDispatch

/**
 * Returns redux-dispatch
 */
export function getDispatch<T = Dispatch<AnyAction>>(): T {
    return <T>(currentData.dispatch ??= addToRenderAndCall(useDispatch))
}
