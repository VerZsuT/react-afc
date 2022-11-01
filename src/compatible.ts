import type { Context } from 'react'
import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import type { AnyAction, Dispatch } from 'redux'

import { isConstructing as inAFC } from './lib'
import type { Actions, ReduxSelectors, Ref, State, StateReturns, StateSetters } from './types'

import * as AFC from './index'

/**
 * _Compatible with non-afc components_
 *
 * Creates a state
 *
 * _Before applying the state changes, superficially compares the previous and new state_
 * @returns - { state, set<Key> }
 */
export function createState<T extends State>(initial: T): StateReturns<T> {
  if (inAFC) return AFC.createState<T>(initial)

  const setState = useState<{}>()[1]

  const [state, setters] = onceCreated(() => {
    const value = { ...initial }
    const obj = {} as StateSetters<T>
    for (const name in value) {
      const setterName = `set${name[0].toUpperCase()}${name.slice(1)}`
      obj[setterName] = (newValue: any) => {
        if (value[name] === newValue) return
        value[name] = newValue
        setState({})
      }
    }
    return [value, obj]
  })

  return { state, ...setters }
}

/**
 * _Compatible with non-afc components_
 *
 * Returns redux-dispatch
 */
export function getDispatch<T = Dispatch<AnyAction>>(): T {
  if (inAFC) return AFC.getDispatch<T>()
  return useDispatch() as T
}

/**
 * _Compatible with non-afc components_
 *
 * Subscribes to context changes
 * @returns context getter
 */
export function handleContext<T>(context: Context<T>): () => T {
  if (inAFC) return AFC.handleContext<T>(context)

  const value = useContext(context)
  return () => value
}

/**
 * _Compatible with non-afc components_
 *
 * Returns the getter of the memoized value
 */
export function memoized<T>(factory: () => T, depsGetter: () => any[]): () => T {
  if (inAFC) return AFC.memoized<T>(factory, depsGetter)

  const value = useMemo(factory, depsGetter())
  return () => value
}

/**
 * _Compatible with non-afc components_
 *
 * Ensures that the value of the variable will be calculated **once** in _afc_ and _non-afc_ components
 */
export function onceCreated<T>(factory: () => T): T {
  if (inAFC) return factory()

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

/**
 * _Compatible with non-afc components_
 *
 * Calls the function after unmounting the component
 *
 * _Analog of `useEffect(() => callback, [])`_
 */
export function onDestroy(callback: () => void): void {
  if (inAFC)
    AFC.onDestroy(callback)
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
  if (inAFC)
    AFC.onDraw(callback)
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
  if (inAFC)
    AFC.onMount(callback)
  else
    useEffect(callback, [])
}

/**
 * _Compatible with non-afc components_
 *
 * Calls the function immediately in constructor and before each render
 */
export function onRender(callback: () => void): void {
  if (inAFC)
    AFC.onRender(callback)
  else
    callback()
}

/**
 * _Compatible with non-afc components_
 *
 * Returns reactive state.
 * Changes to the state will cause the component to be updated.
 */
export function reactive<T extends State>(state: T): T {
  if (inAFC) return AFC.reactive<T>(state)
  
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

/**
 * _Compatible with non-afc components_
 *
 * Creates an object of the form `{ value: <ref_value> }`.
 *
 * When the `value` changes, the component is updated
 */
export function ref<T>(initial: T, isReactive = true): Ref<T> {
  if (inAFC) return AFC.ref<T>(initial, isReactive)
  if (!isReactive) return useRef({ value: initial }).current

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

/**
 * _Compatible with non-afc components_
 *
 * Returns wrapped redux actions to use it without dispatcher
 */
export function useActions<T extends Actions>(actions: T): T {
  if (inAFC) return AFC.useActions<T>(actions)
  
  const dispatch = useDispatch()
  return onceCreated(() => {
    const obj = {} as T
    for (const name in actions)
      obj[name] = ((arg: any) => dispatch(actions[name](arg))) as typeof actions[typeof name]

    return obj
  })
}

/**
 * _Compatible with non-afc components_
 *
 * Subscribes to redux-store changes and gets values depending on the passed configuration
 * @param selectors - object of the type `{ key: selector }`
 */
export function useRedux<T extends ReduxSelectors>(selectors: T) {
  if (inAFC) return AFC.useRedux<T>(selectors)
  
  const state = {} as { [key in keyof T]: ReturnType<T[key]> }
  for (const name in selectors)
    state[name] = useSelector(selectors[name])

  return state
}

export type { AFC } from './types'
