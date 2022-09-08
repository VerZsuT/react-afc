import {useDispatch} from 'react-redux'
import type {AnyAction, Dispatch} from 'redux'

import {addToRenderAndCall, currentData} from '../lib'

/**
 * Returns redux-dispatcher
 */
export function getDispatcher<T extends Dispatch<AnyAction> = Dispatch<AnyAction>>(): T {
    return <T>(currentData.dispatch ??= addToRenderAndCall(useDispatch))
}
