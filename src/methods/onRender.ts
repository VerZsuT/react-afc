import {addToRenderAndCall} from '../lib'

/**
 * @deprecated use `onRender` instead
 */
export const inRender = onRender

/**
 * Calls the function immediately in constructor and before each render
 */
export function onRender(callback: () => void): void {
    addToRenderAndCall(callback)
}
