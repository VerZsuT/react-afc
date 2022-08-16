import { memo, useContext, useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react'
import type { Context, FC } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import type { AnyAction, Dispatch } from 'redux'

import type { Constructor, Data, UseReduxConfig } from './types'

let currentData: Data<any> = null

/**
 * Returns a component with constructor functionality
 */
export function afc<P extends {}>(constructor: Constructor<P>): FC<P> {
    return (props: P) => {
        const data = useData<P>()
        updateProps(data.props, props)

        if (data.render)
            data.beforeRender()
        else
            construct(constructor, data)

        return data.render()
    }
}

/**
 * Returns a memo component with constructor functionality
 */
export function afcMemo<P extends {}>(constructor: Constructor<P>) {
    return memo(afc(constructor))
}

/**
 * Returns the getter of the memoized value
 */
export function memoized<T>(factory: () => T, depsGetter: () => any[]) {
    checkOutsideCall('memoized')
    let value: T
    callAndAddToRender(() => {
        value = useMemo<T>(factory, depsGetter())
    })

    return () => value
}

/**
 * Returns redux-dispatcher
 */
export function getDispatcher<T extends Dispatch<AnyAction>>(): T {
    checkOutsideCall('getDispatcher')
    return callAndAddToRender<T>(useDispatch)
}

/**
 * Subscribes to context changes
 * @returns context getter
 */
export function handleContext<T>(context: Context<T>): () => T {
    checkOutsideCall('handleContext')
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
    checkOutsideCall('afterUnmount')
    callAndAddToRender(() => {
        useEffect(() => callback, [])
    })
}

/**
 * Calls the function after mounting the component
 *
 * _Analog of `useEffect(callback, [])`_
 */
export function afterMount(callback: () => void): void {
    checkOutsideCall('afterMount')
    callAndAddToRender(() => {
        useEffect(callback, [])
    })
}

/**
 * Calls the function after drawing the component
 *
 _Analog of `useLayoutEffect(callback, [])`_
 */
export function afterDraw(callback: () => void): void {
    checkOutsideCall('afterDraw')
    callAndAddToRender(() => {
        useLayoutEffect(callback, [])
    })
}

/**
 * Creates a state
 *
 * _Before applying the state changes, superficially compares the previous and new state_
 * @returns - [state, stateGetter]
 */
export function createState<T>(initial: T) {
    checkOutsideCall('createState')
    addToRender(() => useState(null))
    return prepareState(initial)
}

/**
 * Calls the function immediately and before each render
 */
export function inRender(callback: () => void): void {
    checkOutsideCall('inRender')
    callAndAddToRender(callback)
}

/**
 * Subscribes to redux-store changes and gets values depending on the passed configuration
 * @param config - object of the type `{key: selector}`
 */
export function useRedux<T extends UseReduxConfig<any>>(config: T): {
    [key in keyof typeof config]: ReturnType<typeof config[key]>
} {
    checkOutsideCall('useRedux')
    const state: any = {}

    callAndAddToRender(() => {
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

function callAndAddToRender<T>(callback: () => T): T {
    addToRender(callback)
    return callback()
}

function prepareState<T extends {}>(initial: T): [T, (partialState: Partial<T>) => void] {
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
    ]
}

function checkOutsideCall(name: string): void {
    if (currentData === null)
        throw new Error(`Attempt to call '${name}' outside the constructor`)
}

function construct<P extends {}>(constructor: Constructor<P>, data: Data<P>): void {
    const prevData = currentData
    currentData = data
    data.render = constructor(data.props)
    currentData = prevData
}

function updateProps<P extends {}>(prevProps: P, newProps: P): void {
    for (const name in prevProps)
        delete prevProps[name]

    Object.assign(prevProps, newProps)
}

function useData<P extends {}>(): Data<P> {
    const ref = useRef<Data<P>>(null)

    if (!ref.current) {
        ref.current = {
            beforeRender: () => null,
            render: null,
            props: <P>{}
        }
    }

    return ref.current
}
