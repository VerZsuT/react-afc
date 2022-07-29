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
    Methods,
    Data
} from './types'

function outsideCallHandler(name: string) { 
    return () => { throw new Error(`Попытка вызвать ${name} вне конструктора`) }
}

let methods: Methods = {
    handleContext: outsideCallHandler('handleContext'),
    getDispatcher: outsideCallHandler('getDispatcher'),
    afterUnmount: outsideCallHandler('afterUnmount'),
    createState: outsideCallHandler('createState'),
    inRender: outsideCallHandler('inRender'),
    useRedux: outsideCallHandler('useRedux')
}

export const getDispatcher: GetDispatcherType = () => methods.getDispatcher()
export const handleContext: HandleContextType = context => methods.handleContext(context)
export const afterUnmount: AfterUnmountType = callback => methods.afterUnmount(callback)
export const createState: CreateStateType = initial => methods.createState(initial)
export const inRender: InRenderType = callback => methods.inRender(callback)
export const useRedux: UseReduxType = config => methods.useRedux(config)

function advancedComponent<P extends {}>(constructor: Constructor<P>) {
    return memo((props: P) => {
        const ref = useRef<Data<P>>(null)
        let data = ref.current

        if (!data) {
            ref.current = data = {
                beforeRender: () => null,
                render: null,
                props: {...props}
            }

            const beforeMethods = methods
            methods = closureMethods(data)
            data.render = constructor(data.props)
            methods = beforeMethods

            return data.render()
        }

        for (const name in data.props)
            delete data.props[name]

        Object.assign(data.props, props)

        data.beforeRender()
        return data.render()
    })
}

function closureMethods<T>(data: Data<T>): Methods {
    function addToRender(callback: () => void) {
        const prev = data.beforeRender
        data.beforeRender = () => {
            prev()
            callback()
        }
    }

    return {
        afterUnmount(callback) {
            addToRender(() => useEffect(() => callback, []))
            useEffect(() => callback, [])
        },
        useRedux(config) {
            const state: any = {}

            function getValues() {
                for (const name in config)
                    state[name] = useSelector(config[name])
            }

            addToRender(getValues)
            getValues()

            return state
        },
        createState(initialState) {
            addToRender(() => useState(null))
            return prepareState(initialState)
        },
        inRender(callback) {
            addToRender(callback)
            callback()
        },
        handleContext(context) {
            let contextValue = useContext(context)
            addToRender(() => contextValue = useContext(context))
            return () => contextValue
        },
        getDispatcher() {
            addToRender(useDispatch)
            return useDispatch()
        }
    }
}

export default advancedComponent
