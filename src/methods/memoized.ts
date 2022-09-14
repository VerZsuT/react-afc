import {useMemo} from 'react'

import {addToRenderAndCall} from '../lib'

/**
 * Returns the getter of the memoized value
 */
export function memoized<T>(factory: () => T, depsGetter: () => any[]) {
    let value: T
    addToRenderAndCall(() => value = useMemo(factory, depsGetter()))
    return () => value
}
