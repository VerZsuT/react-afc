import { useState } from 'react'

import type { Data } from './types'

const errorHandler = (_: any, name: string | symbol): boolean => {
  if (['beforeRender', 'forceUpdate', 'dispatch', 'events', 'render', 'props'].includes(name.toString()))
    throw new Error('Attempt to outside call react-afc method')
  return false
}
const initialData = <Data<{}>> new Proxy({}, {
  get: errorHandler,
  set: errorHandler
})

export let currentData: Data<any> = initialData
export let isConstructing = false

export function setData<T>(data: Data<T>): void {
  currentData = data
  isConstructing = true
}

export function resetData(): void {
  currentData = initialData
  isConstructing = false
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
  return currentData.forceUpdate ??= (() => {
    const stateSetter = addToRenderAndCall(useState)[1]
    return () => stateSetter({})
  })()
}

export function lazyUpdateProps(source: any, dest: any): void {
  for (const key in dest) {
    if (key in source) continue
    delete dest[key]
  }
  fastUpdateProps(source, dest)
}

export function fastUpdateProps(source: any, dest: any): void {
  for (const key in source)
    dest[key] = source[key]
}
