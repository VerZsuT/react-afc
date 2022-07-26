/* eslint-disable react-hooks/rules-of-hooks */

import { useState } from 'react'

export default <T extends {}>(initial: T) => {
    const state = {...initial}
    const setState = useState(null)[1]

    return [
        state,
        partialState => {
            for (const name in partialState) {
                if (state[name] !== partialState[name]) {
                    Object.assign(state, partialState)
                    setState({})
                    break
                }
            }
        }
    ] as [T, (partialState: Partial<T>) => void]
}
