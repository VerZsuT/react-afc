/* eslint-disable react-hooks/rules-of-hooks */

import { memo, useContext, useRef, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import prepareState from './prepareState'
import type { Constructor, Data, Selector, Stack } from './types'

const stack: Stack = [{
    createState() { throw new Error('Попытка вызывать createState вне конструктора') },
    inRender() { throw new Error('Попытка вызывать inRender вне конструктора') },
    handleContext() { throw new Error('Попытка вызывать handleContext вне конструктора') },
    getDispatcher() { throw new Error('Попытка вызывать getDispatcher вне конструктора') },
    useRedux() { throw new Error('Попытка вызывать getDispatcher вне конструктора') }
}]
const getLast = () => stack[stack.length - 1]

export const createState: Stack[number]['createState'] = initial => {
    return getLast().createState(initial)
}
export const inRender: Stack[number]['inRender'] = callback => {
    return getLast().inRender(callback)
}
export const handleContext: Stack[number]['handleContext'] = context => {
    return getLast().handleContext(context)
}
export const getDispatcher: Stack[number]['getDispatcher'] = () => {
    return getLast().getDispatcher()
}
export const useRedux: Stack[number]['useRedux'] = config => {
    return getLast().useRedux(config)
}
export const select = <T>(selector: () => T) => {
    return <T><unknown> { type: 'selector', value: selector }
}

function advancedComponent<P extends {}>(constructor: Constructor<P>) {
    return memo((props: P) => {
        const local: Data<P> = useRef({
            inserts: [],
            render: null,
            context: null,
            props: <P>{}
        }).current

        local.props = props

        if (local.render) {
            local.inserts.forEach(callback => callback())
        }
        else {
            const propsProxy = new Proxy(<P>{}, {
                get: (_, name) => local.props[name]
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
        useRedux<T>(config: T) {
            const state = {} as T

            const selectors: { [name: string]: () => any } = {}
            for (const name in config) {
                const item = config[name] as unknown as T & Selector<T>
                if (item.type === 'selector') {
                    selectors[name] = <()=>any><unknown> item.value
                    state[name] = useSelector(selectors[name])
                }
            }

            local.inserts.push(() => {
                for (const name in selectors)
                    state[name] = useSelector(selectors[name])
            })

            return state
        },
        createState(initialState) {
            const out = prepareState(initialState)
    
            local.inserts.push(() => {
                useState(initialState)
            })
            return out
        },
        inRender(callback) {
            local.inserts.push(callback)
            callback()
        },
        handleContext(context) {
            local.context = useContext(context)
            local.inserts.push(() => {
                local.context = useContext(context)
            })
            return () => local.context
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
