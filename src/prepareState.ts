/* eslint-disable react-hooks/rules-of-hooks */

import { useState } from 'react'

import type { StateRef } from './types'

type OutType<T> = [T, (newState: Partial<T>) => void]

export default <T extends {}>(initial: T): OutType<T> => {
    const ref: StateRef<T> = { current: initial }
    const setState = useState(initial)[1]

    return [
        new Proxy(<T>{}, {
            get: (_, name: string) => ref.current[name],
            ownKeys: () => Reflect.ownKeys(ref.current),
            getOwnPropertyDescriptor(_, name) {
                return {
                    ...Object.getOwnPropertyDescriptor(ref.current, name),
                    configurable: true,
                    enumerable: true
                }
            }
        }),
        (partialState: T) => {
            const newState = { ...ref.current, ...partialState }
            ref.current = newState
            setState(newState)
        }
    ] as OutType<T>
}
