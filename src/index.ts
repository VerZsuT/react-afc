import {memo, useContext, useEffect, useRef, useState, useLayoutEffect, useMemo} from 'react'
import type {Context, FC} from 'react'

import {useDispatch, useSelector} from 'react-redux'
import type {AnyAction, Dispatch} from 'redux'

import type {Constructor, Data, UseReduxConfig} from './types'

let currentData: Data<any> = {
    set beforeRender(_) {
        throw new Error('Attempt to outside call constructor\'s method')
    },
    get beforeRender(): () => void {
        throw new Error('Attempt to outside call constructor\'s method')
    },
    render: null,
    props: {}
}


/**
 * Returns a component with constructor functionality
 */
export function afc<P extends {}>(constructor: Constructor<P>): FC<P> {
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
            if (!Object.hasOwn(props, key))
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
export function afcMemo<P extends {}>(constructor: Constructor<P>) {
    return memo(afc(constructor))
}

/**
 * Returns the getter of the memoized value
 */
export function memoized<T>(factory: () => T, depsGetter: () => any[]) {
    let value: T
    addToRenderAndCall(() => {
        value = useMemo<T>(factory, depsGetter())
    })

    return () => value
}

/**
 * Returns redux-dispatcher
 */
export function getDispatcher<T extends Dispatch<AnyAction>>(): T {
    return addToRenderAndCall<T>(useDispatch)
}

/**
 * Subscribes to context changes
 * @returns context getter
 */
export function handleContext<T>(context: Context<T>): () => T {
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
 * @returns - [state, stateGetter]
 */
export function createState<T>(initial: T) {
    addToRender(() => useState(null))
    return prepareState(initial)
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
export function useRedux<T extends UseReduxConfig<any>>(config: T): {
    [key in keyof typeof config]: ReturnType<typeof config[key]>
} {
    const state: any = {}

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

function addToRenderAndCall<T>(callback: () => T): T {
    addToRender(callback)
    return callback()
}

function prepareState<T extends {}>(initial: T): [T, (partialState: Partial<T>) => void] {
    const state = {...initial}
    const setState = useState<{}>()[1]

    return [
        state,
        partialState => {
            for (const name in partialState) {
                if (state[name] !== partialState[name]) {
                    for (const key in partialState)
                        state[key] = partialState[key]
                    setState({})
                    break
                }
            }
        }
    ]
}
