import { useLayoutEffect } from 'react'

import { addToRenderAndCall, currentData } from '../lib'

/**
 * Calls the function after drawing the component
 *
 * _Analog of `useLayoutEffect(callback, [])`_
 */
export function onDraw(callback: () => void): void {
  const events = currentData.events

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
    useLayoutEffect(events.afterDraw!, [])
  })
}

/**
 * @deprecated use `onDraw` instead
 */
export const afterDraw = onDraw
