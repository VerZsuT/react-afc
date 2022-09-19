// hooks-like
export { afc } from './methods/afc'
export { afcMemo } from './methods/afcMemo'
export { afterDraw, onDraw } from './methods/onDraw'
export { afterMount, onMount } from './methods/onMount'
export { afterUnmount, onDestroy } from './methods/onDestroy'
export { inRender, onRender } from './methods/onRender'
export { createState } from './methods/createState'
export { getDispatcher, getDispatch } from './methods/getDispatch'
export { useRedux } from './methods/useRedux'
export { useActions } from './methods/useActions'
export { handleContext } from './methods/handleContext'
export { memoized } from './methods/memoized'

// angular-like
export { Injectable, inject } from './methods/inject'

// vue-like
export { ref } from './methods/ref'
export { reactive } from './methods/reactive'

export type { AFC } from './types'
