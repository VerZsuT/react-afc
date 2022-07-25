/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */

import { memo, useContext, useEffect, useRef, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import prepareState from './prepareState'
import type {
    Constructor,
    CreateStateType,
    GetDispatcherType,
    HandleContextType,
    AfterUnmountType,
    InRenderType,
    UseReduxType,
    Stack,
    Data
} from './types'

function outsideCallHandler(name: string) { 
    return () => { throw new Error(`Попытка вызвать ${name} вне конструктора`) }
}

const stack: Stack = [{
    handleContext: outsideCallHandler('handleContext'),
    getDispatcher: outsideCallHandler('getDispatcher'),
    afterUnmount: outsideCallHandler('afterUnmount'),
    createState: outsideCallHandler('createState'),
    inRender: outsideCallHandler('inRender'),
    useRedux: outsideCallHandler('useRedux')
}]

const last = () => stack[stack.length - 1]

export const getDispatcher: GetDispatcherType = () => last().getDispatcher()
export const handleContext: HandleContextType = context => last().handleContext(context)
export const afterUnmount: AfterUnmountType = callback => last().afterUnmount(callback)
export const createState: CreateStateType = initial => last().createState(initial)
export const inRender: InRenderType = callback => last().inRender(callback)
export const useRedux: UseReduxType = config => last().useRedux(config)

function advancedComponent<P extends {}>(constructor: Constructor<P>) {
    return memo((props: P) => {
        const local: Data<P> = useRef({
            render: null,
            inserts: [],
            contexts: [],
            props: <P>{}
        }).current

        for (const name in local.props)
            delete local.props[name]

        Object.assign(local.props, props)

        if (local.render === null) {
            stack.push(closureMethods(local))
            local.render = constructor(local.props)
            stack.pop()
            return local.render()
        }

        local.inserts.forEach(callback => callback())

        return local.render()
    })
}

function closureMethods<T>(local: Data<T>): Stack[number] {
    return {
        afterUnmount(callback) {
            local.inserts.push(() => useEffect(() => callback, []))
            useEffect(() => callback, [])
        },
        useRedux(config) {
            const state: any = {}
            const selectors: { [name: string]: (state: any) => any } = {}

            for (const name in config) {
                selectors[name] = config[name]
                state[name] = useSelector(selectors[name])
            }

            local.inserts.push(() => {
                for (const name in selectors)
                    state[name] = useSelector(selectors[name])
            })

            return state
        },
        createState(initialState) {
            local.inserts.push(() => useState(initialState))
            return prepareState(initialState)
        },
        inRender(callback) {
            local.inserts.push(callback)
            callback()
        },
        handleContext(context) {
            const index = local.contexts.length
            local.contexts[index] = useContext(context)
            local.inserts.push(() => local.contexts[index] = useContext(context))
            return () => local.contexts[index]
        },
        getDispatcher() {
            local.inserts.push(useDispatch)
            return useDispatch()
        }
    }
}

export default advancedComponent
