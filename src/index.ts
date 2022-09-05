import {memo, useContext, useEffect, useRef, useState, useLayoutEffect, useMemo} from 'react'
import type {Context, FC} from 'react'

import {useDispatch, useSelector} from 'react-redux'
import type {AnyAction, Dispatch} from 'redux'

import type {
    Actions,
    Constructor,
    StateReturns,
    UseReduxConfig,
    Data, StateSetters
} from './types'

let currentData: Data<any> = {
    set beforeRender(_) {
        throw new Error('Attempt to outside call react-afc constructor\'s method')
    },
    get beforeRender(): () => void {
        throw new Error('Attempt to outside call react-afc constructor\'s method')
    },
    render: null,
    props: {}
}

/**
 * Returns a component with constructor functionality
 */
export function afc<P extends {} = {}>(constructor: Constructor<P>): FC<P> {
    return (props: P) => {
        const ref = useRef<Data<P>>()
        let data = ref.current

        if (!data) {
            ref.current = data = {
                beforeRender() {
                    const prevData = currentData
                    data.beforeRender = () => null
                    currentData = data
                    data.render = constructor(data.props)
                    currentData = prevData
                },
                render: null,
                props: <P>{}
            }
        }

        for (const key in data.props) {
            if (!(key in props))
                delete data.props[key]
        }
        for (const key in props)
            data.props[key] = props[key]

        data.beforeRender()
        return data.render()
    }
}

/**
 * Returns a memo component with constructor functionality
 */
export function afcMemo<P extends {} = {}>(constructor: Constructor<P>) {
    return memo(afc(constructor))
}

/**
 * Returns the getter of the memoized value
 */
export function memoized<T = undefined>(factory: () => T, depsGetter: () => any[]) {
    let value: T
    addToRenderAndCall(() => {
        value = useMemo<T>(factory, depsGetter())
    })

    return () => value
}

/**
 * Returns redux-dispatcher
 */
export function getDispatcher<T extends Dispatch<AnyAction> = Dispatch<AnyAction>>(): T {
    return addToRenderAndCall<T>(useDispatch)
}

/**
 * Returns wrapped redux actions to use it without dispatcher
 */
export function useActions<T extends Actions = {}>(actions: T): T {
    const dispatch = getDispatcher()
    const obj = <T>{}
    for (const name in actions) {
        type objItem = typeof actions[typeof name]
        obj[name] = <objItem>((arg: any) => dispatch(actions[name](arg)))
    }
    return obj
}

/**
 * Subscribes to context changes
 * @returns context getter
 */
export function handleContext<T = undefined>(context: Context<T>): () => T {
    let contextValue = useContext(context)
    addToRender(() => {
        contextValue = useContext(context)
    })
    return () => contextValue
}

/**
 * Calls the function after unmounting the component
 *
 * _Analog of `useEffect(() => callback, [])`_
 */
export function afterUnmount(callback: () => void): void {
    addToRenderAndCall(() => {
        useEffect(() => callback, [])
    })
}

/**
 * Calls the function after mounting the component
 *
 * _Analog of `useEffect(callback, [])`_
 */
export function afterMount(callback: () => void): void {
    addToRenderAndCall(() => {
        useEffect(callback, [])
    })
}

/**
 * Calls the function after drawing the component
 *
 _Analog of `useLayoutEffect(callback, [])`_
 */
export function afterDraw(callback: () => void): void {
    addToRenderAndCall(() => {
        useLayoutEffect(callback, [])
    })
}

/**
 * Creates a state
 *
 * _Before applying the state changes, superficially compares the previous and new state_
 * @returns - {state, set<Key>}
 */
export function createState<T extends {} = {}>(initial: T): StateReturns<T> {
    const state = {...initial}
    const setState = addToRenderAndCall(() => useState<{}>()[1])
    const setters = <StateSetters<T>>{}

    for (const name in initial) {
        const setterName = `set${name[0].toUpperCase()}${name.slice(1)}`
        setters[setterName] = (value: any) => {
            if (state[name] === value) return
            state[name] = value
            setState({})
        }
    }

    return {state, ...setters}
}

/**
 * Calls the function immediately and before each render
 */
export function inRender(callback: () => void): void {
    addToRenderAndCall(callback)
}

/**
 * Subscribes to redux-store changes and gets values depending on the passed configuration
 * @param config - object of the type `{key: selector}`
 */
export function useRedux<S extends {} = {}, T extends UseReduxConfig<S> = {}>(config: T) {
    const state = {} as { [key in keyof T]: ReturnType<T[key]> }

    addToRenderAndCall(() => {
        for (const name in config)
            state[name] = useSelector(config[name])
    })

    return state
}

function addToRender(callback: () => void): void {
    const prev = currentData.beforeRender
    currentData.beforeRender = () => {
        prev()
        callback()
    }
}

function addToRenderAndCall<T = undefined>(callback: () => T): T {
    addToRender(callback)
    return callback()
}
