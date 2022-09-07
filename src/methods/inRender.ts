import {addToRenderAndCall} from '../lib'

/**
 * Calls the function immediately and before each render
 */
export function inRender(callback: () => void): void {
    addToRenderAndCall(callback)
}
