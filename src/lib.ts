import { useDebugValue, useState } from 'react'

import type { CommonState, Data, RenderData } from './types'

function dataErrorHandler(_: any, name: string | symbol): boolean {
  const propNames = ['beforeRender', 'forceUpdate', 'dispatch', 'events', 'render', 'state', 'prevProps', 'props']
  if (propNames.includes(name.toString())) // for react-native
    throw new Error('Attempt to outside call react-afc method')
  return false
}
function renderDataErrorHandler(_: any, name: string | symbol): boolean {
  const propNames = ['callbacks']
  if (propNames.includes(name.toString())) // for react-native
    throw new Error('Attempt to outside call react-afc render method')
  return false
}

const initialData: Data<any> = new Proxy({}, {
  get: dataErrorHandler,
  set: dataErrorHandler
})

const initialRenderData: RenderData = new Proxy({}, {
  get: renderDataErrorHandler,
  set: renderDataErrorHandler
})

let currentData: Data<any> = initialData
let currentRenderData: RenderData = initialRenderData

export const getData = () => currentData
export const getRenderData = () => currentRenderData
export const isConstruct = () => currentData !== initialData
export const isRender = () => currentRenderData !== initialRenderData

export function withData(data: Data<any>, callback: () => void) {
  const prevData = currentData
  currentData = data
  callback()
  currentData = prevData
}

export function withRenderData(renderData: RenderData, callback: () => void) {
  const prevData = currentRenderData
  currentRenderData = renderData
  callback()
  currentRenderData = prevData
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

export function addState<T = null>(initial = null as T): CommonState<T> {
  const state = currentData.state
  const currentIndex = state.lastIndex + 1
  state[++state.lastIndex] = initial

  return [
    () => state[currentIndex],
    val => state[currentIndex] = val
  ]
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
