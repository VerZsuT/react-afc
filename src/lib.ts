import { useState } from 'react'

import type { Data } from './types'

const dataProps = ['beforeRender', 'forceUpdate', 'dispatch', 'events', 'render', 'props']
const errorHandler = (_: any, name: string | symbol): boolean => {
  if (dataProps.includes(name.toString()))
    throw new Error('Attempt to outside call react-afc method')
  return false
}
const initialData = <Data<{}>> new Proxy({}, {
  get: errorHandler,
  set: errorHandler
})

let currentData: Data<any> = initialData
let construct = false

export const getCurrentData = () => currentData
export const isConstruct = () => construct

export function setData<T>(data: Data<T>): void {
  currentData = data
  construct = true
}

export function resetData(): void {
  currentData = initialData
  construct = false
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
