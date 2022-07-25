/* eslint-disable react-hooks/rules-of-hooks */

import { useState } from 'react'

export default <T extends {}>(initial: T) => {
    const state = initial
    const setState = useState({})[1]

    return [
        state,
        partialState => {
            Object.assign(state, partialState)
            setState({})
        }
    ] as [T, (partialState: Partial<T>) => void]
}
