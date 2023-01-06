import { useState } from 'react'

import type { Data } from './types'

const dataProps = ['beforeRender', 'forceUpdate', 'dispatch', 'events', 'render', 'props']
const errorHandler = (_: any, name: string | symbol): boolean => {
  if (dataProps.includes(name.toString())) // for react-native
    throw new Error('Attempt to outside call react-afc method')
  return false
}
const initialData: Data<{}> = new Proxy({}, {
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

export function addToRender<T extends () => any>(callback: T): T {
  const prev = currentData.beforeRender
  currentData.beforeRender = () => { prev(); callback() }
  return callback
}

export function addToRenderAndCall<T = undefined>(callback: () => T): T {
  return addToRender(callback)()
}

export function getForceUpdate(): () => void {
  if (!currentData.forceUpdate) {
    const stateSetter = addToRenderAndCall(useState)[1]
    currentData.forceUpdate = () => stateSetter({})
  }
  return currentData.forceUpdate
}

export function lazyUpdateProps<DestType>(source: any, dest: DestType): DestType {
  for (const key in dest) {
    if (key in source) continue
    delete dest[key]
  }
  return fastUpdateProps(source, dest)
}

export function fastUpdateProps<DestType>(source: any, dest: DestType): DestType {
  for (const key in source)
    dest[key] = source[key]
  return dest
}
