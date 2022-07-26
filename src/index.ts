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
    Data,
    FuncToInsert
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
                render: null,
                inserts: new Set<FuncToInsert>(),
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
        data.inserts.forEach(callback => callback())

        return data.render()
    })
}

function closureMethods<T>(data: Data<T>): Methods {
    return {
        afterUnmount(callback) {
            data.inserts.add(() => useEffect(() => callback, []))
            useEffect(() => callback, [])
        },
        useRedux(config) {
            const state: any = {}

            function getValues() {
                for (const name in config)
                    state[name] = useSelector(config[name])
            }

            data.inserts.add(getValues)
            getValues()

            return state
        },
        createState(initialState) {
            data.inserts.add(() => useState(null))
            return prepareState(initialState)
        },
        inRender(callback) {
            data.inserts.add(callback)
            callback()
        },
        handleContext(context) {
            let contextValue = useContext(context)
            data.inserts.add(() => contextValue = useContext(context))
            return () => contextValue
        },
        getDispatcher() {
            data.inserts.add(useDispatch)
            return useDispatch()
        }
    }
}

export default advancedComponent
