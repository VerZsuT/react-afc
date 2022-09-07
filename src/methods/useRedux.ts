import {useSelector} from 'react-redux'

import {addToRenderAndCall} from '../lib'
import type {UseReduxConfig} from '../types'

/**
 * Subscribes to redux-store changes and gets values depending on the passed configuration
 * @param config - object of the type `{key: selector}`
 */
export function useRedux<S extends {} = {}, T extends UseReduxConfig<S> = {}>(config: T) {
    const state = {} as { [key in keyof T]: ReturnType<T[key]> }

    addToRenderAndCall(() => {
        for (const name in config)
            state[name] = useSelector(config[name])
    })

    return state
}
