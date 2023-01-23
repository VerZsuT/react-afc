import { useDebugValue, useState } from 'react'

import type { Data } from './types'

const errorHandler = (_: any, name: string | symbol): boolean => {
  const propNames = ['beforeRender', 'forceUpdate', 'dispatch', 'callbacks', 'render', 'state', 'prevProps', 'props']
  if (propNames.includes(name.toString())) // for react-native
    throw new Error('Attempt to outside call react-afc method')
  return false
}
const initialData: Data<any> = new Proxy({}, {
  get: errorHandler,
  set: errorHandler
})

let currentData: Data<any> = initialData

export const getData = () => currentData
export const isConstruct = () => currentData !== initialData

export function withData(data: Data<any>, callback: () => void): void {
  const prevData = currentData
  currentData = data
  callback()
  currentData = prevData
}

export function addToRender<T extends () => any>(callback: T) {
  const prev = currentData.beforeRender
  currentData.beforeRender = () => { prev(); callback() }
  return callback
}

export function addToRenderAndCall<T = undefined>(callback: () => T) {
  return addToRender(callback)()
}

export function inspectState(data: Data<any>) {
  useDebugValue(data.state)
}

export function getForceUpdate() {
  if (!currentData.forceUpdate) {
    const stateSetter = addToRenderAndCall(useState)[1]
    currentData.forceUpdate = () => stateSetter({})
  }
  return currentData.forceUpdate
}

export function addState<T = null>(initial = null as T): { val: T } {
  const state = currentData.state
  const currentIndex = state.lastIndex + 1
  state[++state.lastIndex] = initial

  return {
    get val() { return state[currentIndex] },
    set val(v) { state[currentIndex] = v }
  }
}

export function lazyUpdateProps<DestType extends object>(source: any, dest: DestType) {
  for (const key in dest) {
    if (key in source) continue
    delete dest[key]
  }
  return fastUpdateProps(source, dest)
}

export function fastUpdateProps<DestType extends object>(source: any, dest: DestType) {
  return Object.assign(dest, source)
}

export function changeName<
  CompType extends Function,
  ConstrType extends Function
>(component: CompType, contructor: ConstrType): CompType {
  component['displayName'] = contructor.name || 'afc_anon'
  return component
}
