import { useState } from 'react'

import type { Data } from './types'

const initialData = <Data<{}>> new Proxy({}, {
  get(): any {
    throw new Error('Attempt to outside call react-afc method')
  },
  set() {
    throw new Error('Attempt to outside call react-afc method')
  }
})

export let currentData: Data<any> = initialData
export let isConstructing = false

export function setConstructing(value: boolean): void {
  isConstructing = value
}

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

