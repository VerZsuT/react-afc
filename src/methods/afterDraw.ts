import {useLayoutEffect} from 'react'

import {addToRenderAndCall, data} from '../lib'

/**
 * Calls the function after drawing the component
 *
 _Analog of `useLayoutEffect(callback, [])`_
 */
export function afterDraw(callback: () => void): void {
    const events = data.current.events

    if (events.afterDraw) {
        const prevHandler = events.afterDraw
        events.afterDraw = () => {
            prevHandler()
            callback()
        }
        return
    }

    events.afterDraw = callback
    addToRenderAndCall(() => {
        useLayoutEffect(events.afterDraw, [])
    })
}
