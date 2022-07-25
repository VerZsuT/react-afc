/* eslint-disable react-hooks/rules-of-hooks */

import { memo, useContext, useEffect, useRef, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import MethodsStack from './MethodsStack'
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

const stack = new MethodsStack()

export const getDispatcher: GetDispatcherType = () => stack.last.getDispatcher()
export const handleContext: HandleContextType = context => stack.last.handleContext(context)
export const afterUnmount: AfterUnmountType = callback => stack.last.afterUnmount(callback)
export const createState: CreateStateType = initial => stack.last.createState(initial)
export const inRender: InRenderType = callback => stack.last.inRender(callback)
export const useRedux: UseReduxType = config => stack.last.useRedux(config)

function advancedComponent<P extends {}>(constructor: Constructor<P>) {
    return memo((props: P) => {
        const local: Data<P> = useRef({
            inserts: [],
            render: null,
            contexts: [],
            props: <P>{}
        }).current

        local.props = props

        if (local.render) {
            local.inserts.forEach(callback => callback())
        }
        else {
            const propsProxy = new Proxy(<P>{}, {
                get: (_, name) => local.props[name],
                ownKeys: () => Reflect.ownKeys(local.props),
                getOwnPropertyDescriptor(_, name) {
                    return {
                        ...Object.getOwnPropertyDescriptor(local.props, name),
                        configurable: true,
                        enumerable: true
                    }
                }
            })

            stack.push(getFuncs(local))
            local.render = constructor(propsProxy)
            stack.pop()
        }

        return local.render()
    })
}

function getFuncs<T>(local: Data<T>): Stack[number] {
    return {
        afterUnmount(callback) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            useEffect(() => callback, [])
            local.inserts.push(() => {
                useEffect(() => callback, [])
            })
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
            local.inserts.push(() => {
                useState(initialState)
            })
            return prepareState(initialState)
        },
        inRender(callback) {
            local.inserts.push(callback)
            callback()
        },
        handleContext(context) {
            const index = local.contexts.length
            local.contexts[index] = useContext(context)
            local.inserts.push(() => {
                local.contexts[index] = useContext(context)
            })
            return () => local.contexts[index]
        },
        getDispatcher() {
            local.inserts.push(() => {
                useDispatch()
            })
            return useDispatch()
        }
    }
}

export default advancedComponent
