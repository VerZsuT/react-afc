import { useEffect } from 'react'

import { addToRenderAndCall, currentData } from '../lib'

/**
 * @deprecated use `onDestroy` instead
 */
export const afterUnmount = onDestroy

/**
 * Calls the function after unmounting the component
 *
 * _Analog of `useEffect(() => callback, [])`_
 */
export function onDestroy(callback: () => void): void {
  const events = currentData.events

  if (events.afterUnmount) {
    const prevHandler = events.afterUnmount
    events.afterUnmount = () => {
      prevHandler()
      callback()
    }
    return
  }

  events.afterUnmount = callback
  addToRenderAndCall(() => {
    useEffect(() => events.afterUnmount, [])
  })
}
