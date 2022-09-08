import {getForceUpdate} from '../lib'
import type {StateReturns, StateSetters} from '../types'

/**
 * Creates a state
 *
 * _Before applying the state changes, superficially compares the previous and new state_
 * @returns - {state, set<Key>}
 */
export function createState<T extends {} = {}>(initial: T): StateReturns<T> {
    const forceUpdate = getForceUpdate()
    const setters = {} as StateSetters<T>
    const state = {...initial}

    for (const name in initial) {
        setters[`set${name[0].toUpperCase()}${name.slice(1)}`] = (value: any) => {
            if (state[name] === value) return
            state[name] = value
            forceUpdate()
        }
    }

    return {state, ...setters}
}
