import { isConstructing } from '../lib'
import { onRender as incOnRender } from '../methods/onRender'

/**
 * _Compatible with non-afc components_
 *
 * Calls the function immediately in constructor and before each render
 */
export function onRender(callback: () => void): void {
  if (isConstructing)
    incOnRender(callback)
  else
    callback()
}
