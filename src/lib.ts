import { useState } from 'react'

import { useDispatch } from 'react-redux'

import type {Data} from './types'

const initialData = <Data<{}>> {
    set beforeRender(_) {
        throw new Error('Attempt to outside call react-afc method')
    },
    get beforeRender(): () => void {
        throw new Error('Attempt to outside call react-afc method')
    },
    events: {},
    props: {},
    dispatch: null,
    forceUpdate: null,
    render: null
}

export let currentData: Data<any> = initialData

export function setData<T>(data: Data<T>) {
    currentData = data
}

export function resetData() {
    currentData = initialData
}

export function addToRender(callback: () => void): void {
    const prev = currentData.beforeRender
    currentData.beforeRender = () => {
        prev()
        callback()
    }
}

export function addToRenderAndCall<T = undefined>(callback: () => T): T {
    addToRender(callback)
    return callback()
}

export function getForceUpdate() {
    return currentData.forceUpdate ??= (() => {
        const stateSetter = addToRenderAndCall(useState)[1]
        return () => stateSetter({})
    })()
}

