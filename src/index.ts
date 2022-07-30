/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */

import type { Context } from 'react'
import { memo, useContext, useEffect, useRef, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import type { AnyAction, Dispatch } from 'redux'

import type { Constructor, Data, UseReduxConfig } from './types'

let currentData: Data<any> = null

function addToRender(callback: () => void) {
    const prev = currentData.beforeRender
    currentData.beforeRender = () => {
        prev()
        callback()
    }
}

function prepareState<T extends {}>(initial: T) {
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

function checkOutsideCall(name: string) {
    if (currentData === null)
        throw new Error(`Attempt to call '${name}' outside the constructor`)
}

export function afc<P extends {}>(constructor: Constructor<P>) {
    return (props: P) => {
        const ref = useRef<Data<P>>(null)
        let data = ref.current

        if (!data) {
            ref.current = data = {
                beforeRender: () => null,
                render: null,
                props: {...props}
            }
        
            const prevData = currentData
            currentData = data
            data.render = constructor(data.props)
            currentData = prevData
        
            return data.render()
        }

        for (const name in data.props)
            delete data.props[name]

        Object.assign(data.props, props)

        data.beforeRender()
        return data.render()
    }
}

export function afcMemo<P extends {}>(constructor: Constructor<P>) {
    return memo(afc(constructor))
}

export function getDispatcher<T extends Dispatch<AnyAction>>(): T {
    checkOutsideCall('getDispatcher')
    addToRender(useDispatch)
    return useDispatch()
}

export function handleContext<T>(context: Context<T>) {
    checkOutsideCall('handleContext')
    let contextValue = useContext(context)
    addToRender(() => contextValue = useContext(context))
    return () => contextValue
}

export function afterUnmount(callback: () => void) {
    checkOutsideCall('afterUnmount')
    addToRender(() => useEffect(() => callback, []))
    useEffect(() => callback, [])
}

export function createState<T>(initial: T) {
    checkOutsideCall('createState')
    addToRender(() => useState(null))
    return prepareState(initial)
}

export function inRender(callback: () => void) {
    checkOutsideCall('inRender')
    addToRender(callback)
    callback()
}

export function useRedux<T extends UseReduxConfig<any>>(config: T): {
    [key in keyof typeof config]: ReturnType<typeof config[key]>
} {
    checkOutsideCall('useRedux')
    const state: any = {}

    function getValues() {
        for (const name in config)
            state[name] = useSelector(config[name])
    }

    addToRender(getValues)
    getValues()

    return state
}
