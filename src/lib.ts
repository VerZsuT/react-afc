import { useState } from 'react'

import type { Data } from './types'

const initialData = new Proxy({}, {
  get: () => { throw new Error('Attempt to outside call react-afc method') },
  set: () => { throw new Error('Attempt to outside call react-afc method') }
}) as Data<{}>

export let currentData: Data<any> = initialData
export let isConstructing = false

export function setData<T>(data: Data<T>) {
  currentData = data
  isConstructing = true
}

export function resetData() {
  currentData = initialData
  isConstructing = false
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

