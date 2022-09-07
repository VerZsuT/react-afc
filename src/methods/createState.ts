import {useState} from 'react'

import {addToRenderAndCall, data} from '../lib'
import type {StateReturns, StateSetters} from '../types'

/**
 * Creates a state
 *
 * _Before applying the state changes, superficially compares the previous and new state_
 * @returns - {state, set<Key>}
 */
export function createState<T extends {} = {}>(initial: T): StateReturns<T> {
    const state = {...initial}
    const stateSetter = (data.current.stateSetter ??= addToRenderAndCall(useState)[1])

    const setters = {} as StateSetters<T>
    for (const name in initial) {
        setters[`set${name[0].toUpperCase()}${name.slice(1)}`] = (value: any) => {
            if (state[name] === value) return
            state[name] = value
            stateSetter({})
        }
    }

    return {state, ...setters}
}
