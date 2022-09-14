import {useEffect} from 'react'

import {addToRenderAndCall, currentData} from '../lib'

/**
 * @deprecated use `onMount` instead
 */
export const afterMount = onMount

/**
 * Calls the function after mounting the component
 *
 * _Analog of `useEffect(callback, [])`_
 */
export function onMount(callback: () => void): void {
    const events = currentData.events

    if (events.afterMount) {
        const prevHandler = events.afterMount
        events.afterMount = () => {
            prevHandler()
            callback()
        }
        return
    }

    events.afterMount = callback
    addToRenderAndCall(() => {
        useEffect(events.afterMount!, [])
    })
}
