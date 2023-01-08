import React from 'react'

import { useDispatch as reduxUseDispatch, useSelector as reduxUseSelector } from 'react-redux'
import type { AnyAction, Dispatch } from 'redux'

import { isConstruct as inAFC } from './lib'
import type { Actions, ObjectState, ObjectStateSetters, ReduxSelectors, State } from './types'

import * as AFC from './index'

/**
 * _Compatible with non-afc components_
 *
 * Creates a state from object
 *
 * _Before applying the state changes, superficially compares the previous and new state_
 * @returns - { state, set<Key> }
 */
export function useObjectState<T extends State>(initial: T): ObjectState<T> {
  if (inAFC()) return AFC.useObjectState(initial)

  const setState = React.useState<{}>()[1]

  const [state, setters] = useOnceCreated(() => {
    const value = { ...initial }
    const obj = {} as ObjectStateSetters<T>
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
export function useDispatch<T = Dispatch<AnyAction>>(): T {
  if (inAFC()) return AFC.useDispatch<T>()
  return reduxUseDispatch() as T
}

/**
 * _Compatible with non-afc components_
 *
 * Subscribes to context changes
 * @returns `{ val: <context_value> }`
 */
export function useContext<T>(context: React.Context<T>) {
  if (inAFC()) return AFC.useContext(context)
  return { val: React.useContext(context) }
}

/**
 * _Compatible with non-afc components_
 *
 * Returns the getter of the memoized value
 */
export function useMemo<T>(factory: () => T, depsGetter: () => any[]) {
  if (inAFC()) return AFC.useMemo<T>(factory, depsGetter)
  return { val: React.useMemo(factory, depsGetter()) }
}

/**
 * _Compatible with non-afc components_
 *
 * Ensures that the value of the variable will be calculated **once** in _afc_ and _non-afc_ components
 */
export function useOnceCreated<T>(factory: () => T) {
  if (inAFC()) return factory()

  const ref = React.useRef({
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
 * Returns a component with constructor functionality
 */
export function useForceUpdate() {
  return inAFC()
    ? AFC.useForceUpdate()
    : (() => {
      const stateSetter = React.useState<{}>()[1]
      return () => stateSetter({})
    })()
}

/**
 * _Compatible with non-afc components_
 * 
 * _Analog of `useEffect(callback, deps())`_
 */
export function useEffect(callback: React.EffectCallback, deps?: () => React.DependencyList): void {
  return inAFC()
    ? AFC.useEffect(callback, deps)
    : React.useEffect(callback, deps?.())
}

/**
 * _Compatible with non-afc components_
 * 
 * _Analog of `useLayoutEffect(callback, deps())`_
 */
export function useLayoutEffect(callback: React.EffectCallback, deps?: () => React.DependencyList): void {
  return inAFC()
    ? AFC.useLayoutEffect(callback, deps)
    : React.useLayoutEffect(callback, deps?.())
}

/**
 * _Compatible with non-afc components_
 *
 * Calls the function after unmounting the component
 *
 * _Analog of `useEffect(() => callback, [])`_
 */
export function useOnDestroy(callback: () => void): void {
  return inAFC()
    ? AFC.useOnDestroy(callback)
    : React.useEffect(() => callback, [])
}

/**
 * _Compatible with non-afc components_
 *
 * Calls the function after drawing the component
 *
 * _Analog of `useLayoutEffect(callback, [])`_
 */
export function useOnDraw(callback: () => void): void {
  return inAFC()
    ? AFC.useOnDraw(callback)
    : React.useLayoutEffect(callback, [])
}

/**
 * _Compatible with non-afc components_
 *
 * Calls the function after mounting the component
 *
 * _Analog of `useEffect(callback, [])`_
 */
export function useOnMount(callback: () => void): void {
  return inAFC()
    ? AFC.useOnMount(callback)
    : React.useEffect(callback, [])
}

/**
 * _Compatible with non-afc components_
 *
 * Calls the function immediately in constructor and before each render
 */
export function useOnRender(callback: () => void): void {
  return inAFC()
    ? AFC.useOnRender(callback)
    : callback()
}

/**
 * _Compatible with non-afc components_
 *
 * Returns reactive state.
 * Changes to the state will cause the component to be updated.
 */
export function useReactive<T extends State>(state: T): T {
  if (inAFC()) return AFC.useReactive(state)
  
  const setState = React.useState<{}>()[1]

  return useOnceCreated(() => {
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
 * Creates an object of the form `{ current: <ref_value> }`
 */
export function useRef<T = null>(initial = null as T): React.RefObject<T> {
  if (inAFC()) return AFC.useRef(initial)
  return React.useRef(initial)
}

/**
 * _Compatible with non-afc components_
 *
 * Returns wrapped redux actions to use it without dispatcher
 */
export function useActions<T extends Actions>(actions: T): T {
  if (inAFC()) return AFC.useActions(actions)
  
  const dispatch = reduxUseDispatch()
  return useOnceCreated(() => {
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
  if (inAFC()) return AFC.useRedux(selectors)
  
  const state = {} as { [key in keyof T]: ReturnType<T[key]> }
  for (const name in selectors)
    state[name] = reduxUseSelector(selectors[name])

  return state
}
