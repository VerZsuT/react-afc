import type { Context } from 'react'
import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import type { AnyAction, Dispatch } from 'redux'

import { isConstructing } from './lib'
import type { Ref, StateReturns, StateSetters } from './types'

import * as original from './index'

/**
 * _Compatible with non-afc components_
 *
 * Creates a state
 *
 * _Before applying the state changes, superficially compares the previous and new state_
 * @returns - {state, set<Key>}
 */
export function createState<T extends { [key: string]: any }>(initial: T): StateReturns<T> {
  if (isConstructing) {
    return original.createState<T>(initial)
  }
  else {
    const setState = useState<{}>()[1]

    const [state, setters] = onceCreated(() => {
      const value = { ...initial }
      const obj = {} as StateSetters<T>
      for (const name in value) {
        obj[`set${name[0].toUpperCase()}${name.slice(1)}`] = (newValue: any) => {
          if (value[name] === newValue) return
          value[name] = newValue
          setState({})
        }
      }
      return [value, obj]
    })

    return {state, ...setters}
  }
}

/**
 * _Compatible with non-afc components_
 *
 * Returns redux-dispatch
 */
export function getDispatch<T = Dispatch<AnyAction>>(): T {
  if (isConstructing)
    return original.getDispatch<T>()
  else
    return useDispatch() as T
}

/**
 * _Compatible with non-afc components_
 *
 * Subscribes to context changes
 * @returns context getter
 */
export function handleContext<T>(context: Context<T>): () => T {
  if (isConstructing) {
    return original.handleContext<T>(context)
  }
  else {
    const value = useContext(context)
    return () => value
  }
}

/**
 * _Compatible with non-afc components_
 *
 * Returns the getter of the memoized value
 */
export function memoized<T>(factory: () => T, depsGetter: () => any[]): () => T {
  if (isConstructing) {
    return original.memoized<T>(factory, depsGetter)
  }
  else {
    const value = useMemo(factory, depsGetter())
    return () => value
  }
}

/**
 * _Compatible with non-afc components_
 *
 * Ensures that the value of the variable will be calculated **once** in _afc_ and _non-afc_ components
 */
export function onceCreated<T>(factory: () => T): T {
  if (isConstructing) {
    return factory()
  }
  else {
    const ref = useRef({
      isCreated: false,
      value: null as T
    })

    if (!ref.current.isCreated) {
      ref.current = {
        isCreated: true,
        value: factory()
      }
    }

    return ref.current.value
  }
}

/**
 * _Compatible with non-afc components_
 *
 * Calls the function after unmounting the component
 *
 * _Analog of `useEffect(() => callback, [])`_
 */
export function onDestroy(callback: () => void): void {
  if (isConstructing)
    original.onDestroy(callback)
  else
    useEffect(() => callback, [])
}

/**
 * _Compatible with non-afc components_
 *
 * Calls the function after drawing the component
 *
 * _Analog of `useLayoutEffect(callback, [])`_
 */
export function onDraw(callback: () => void): void {
  if (isConstructing)
    original.onDraw(callback)
  else
    useLayoutEffect(callback, [])
}

/**
 * _Compatible with non-afc components_
 *
 * Calls the function after mounting the component
 *
 * _Analog of `useEffect(callback, [])`_
 */
export function onMount(callback: () => void): void {
  if (isConstructing)
    original.onMount(callback)
  else
    useEffect(callback, [])
}

/**
 * _Compatible with non-afc components_
 *
 * Calls the function immediately in constructor and before each render
 */
export function onRender(callback: () => void): void {
  if (isConstructing)
    original.onRender(callback)
  else
    callback()
}

/**
 * _Compatible with non-afc components_
 *
 * Returns reactive state.
 * Changes to the state will cause the component to be updated.
 */
export function reactive<T extends { [key: string]: any }>(state: T): T {
  if (isConstructing) {
    return original.reactive<T>(state)
  }
  else {
    const setState = useState<{}>()[1]

    return onceCreated<T>(() => {
      const value = { ...state }
      const obj = {} as T
      for (const key in value) {
        Object.defineProperty(obj, key, {
          get: () => value[key],
          set(newValue: any) {
            if (value[key] === newValue) return
            value[key] = newValue
            setState({})
          },
          enumerable: true,
          configurable: false
        })
      }
      return obj
    })
  }
}

/**
 * _Compatible with non-afc components_
 *
 * Creates an object of the form `{ value: <ref_value> }`.
 *
 * When the `value` changes, the component is updated
 */
export function ref<T>(initial: T, isReactive = true): Ref<T> {
  if (isConstructing) {
    return original.ref<T>(initial, isReactive)
  }
  else {
    if (!isReactive)
      return useRef({ value: initial }).current

    const setState = useState<{}>()[1]

    return onceCreated(() => {
      let obj = initial

      return {
        get value(): T {
          return obj
        },
        set value(newVal: T) {
          if (obj === newVal) return
          obj = newVal
          setState({})
        }
      }
    })
  }
}

/**
 * _Compatible with non-afc components_
 *
 * Returns wrapped redux actions to use it without dispatcher
 */
export function useActions
<T extends { [key: string]: (arg: any) => any }>
(actions: T): T {
  if (isConstructing) {
    return original.useActions<T>(actions)
  }
  else {
    const dispatch = useDispatch()
    return onceCreated(() => {
      const obj = {} as T
      for (const name in actions)
        obj[name] = ((arg: any) => dispatch(actions[name](arg))) as typeof actions[typeof name]

      return obj
    })
  }
}

/**
 * _Compatible with non-afc components_
 *
 * Subscribes to redux-store changes and gets values depending on the passed configuration
 * @param config - object of the type `{key: selector}`
 */
export function useRedux
<T extends { [key: string]: (state: any) => any }>
(config: T) {
  if (isConstructing) {
    return original.useRedux<T>(config)
  }
  else {
    const state = {} as { [key in keyof T]: ReturnType<T[key]> }
    for (const name in config)
      state[name] = useSelector(config[name])

    return state
  }
}

export type { AFC } from './types'
