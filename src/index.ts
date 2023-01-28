import React from 'react'

import { useDispatch as reduxUseDispatch, useSelector as reduxUseSelector } from 'react-redux'
import type { AnyAction, Dispatch } from 'redux'

import { addState, addToRenderAndCall, changeName, fastUpdateProps, getData, getForceUpdate, inspectState, lazyUpdateProps, withData } from './lib'
import type { Actions, CommonState, ConstructOptions, Constructor, Data, DynamicHookResult, HookToWrap, ObjectState, ObjectStateSetters, ReduxSelectors, State } from './types'

/**
 * Returns a component with constructor functionality
 */
export function afc<P extends object>(constructor: Constructor<P>, options?: ConstructOptions) {
  const updateProps = options?.lazyPropsUpdate ? lazyUpdateProps : fastUpdateProps

  return changeName((props: P) => {
    const ref = React.useRef<Data<P>>()
    let data = ref.current

    if (!data) {
      data = ref.current = {
        beforeRender: () => null,
        render: () => null,
        callbacks: {},
        state: { lastIndex: -1 },
        prevProps: props,
        props: { ...props }
      }
      inspectState(data)
      withData(data, () => {
        const result = constructor(data!.props)
        if (result instanceof Promise) {
          const forceUpdate = getForceUpdate()
          result.then(render => {
            data!.render = render
            forceUpdate()
          })
        }
        else {
          data!.render = result
        }
      })
      return data.render(props)
    }
    else {
      if (data.prevProps !== props)
        data.prevProps = updateProps(props, data.props)
      inspectState(data)
      data.beforeRender()
      return data.render(props)
    }
  }, constructor) as React.FC<P>
}

/**
 * Returns a memo component with constructor functionality
 */
export function afcMemo<P extends object>(constructor: Constructor<P>, options?: ConstructOptions) {
  return React.memo(afc(constructor, options))
}

/**
 * Creates a state from object
 *
 * _Before applying the state changes, superficially compares the previous and new state_
 * @returns - { state, set<Key> }
 */
export function useObjectState<T extends State>(initial: T): ObjectState<T> {
  const setters = {} as ObjectStateSetters<T>
  const state = addState({ ...initial }).val
  const forceUpdate = getForceUpdate()

  for (const name in initial) {
    const setterName = `set${name[0].toUpperCase()}${name.slice(1)}`
    setters[setterName] = (value: any) => {
      if (state[name] === value) return
      state[name] = value
      forceUpdate()
    }
  }

  return { state, ...setters }
}

/**
 * _Analog of `React.useState(initial)`_
 */
export function useState<T = undefined>(initial: T): CommonState<T> {
  const state = addState(initial)
  const forceUpdate = getForceUpdate()
  const stateSetter = (value: T) => {
    if (value === state.val) return
    state.val = value
    forceUpdate()
  }

  return [state, stateSetter]
}

/**
 * Returns redux-dispatch
 */
export function useDispatch<T = Dispatch<AnyAction>>(): T {
  return (getData().dispatch ||= addToRenderAndCall(reduxUseDispatch)) as T
}

/**
 * Subscribes to context changes
 * @returns `{ val: <context_value> }`
 */
export function useContext<T>(context: React.Context<T>) {
  const value = {} as { val: T }
  addToRenderAndCall(() => value.val = React.useContext(context))
  return value
}

/**
 * Returns the getter of the memoized value
 */
export function useMemo<T>(factory: () => T, depsGetter: () => any[]) {
  const value = {} as { val: T }
  addToRenderAndCall(() => value.val = React.useMemo(factory, depsGetter()))
  return value
}

/**
 * @returns function that updates the component when called
 */
export function useForceUpdate() {
  return getForceUpdate()
}

/**
 * _Analog of `useEffect(callback, deps())`_
 */
export function useEffect(callback: React.EffectCallback, deps?: () => React.DependencyList): void {
  const callbacks = getData().callbacks

  if (callbacks.effect) {
    const prevHandler = callbacks.effect
    callbacks.effect = () => {
      const prevResult = prevHandler()
      const result = callback()
      return () => { prevResult?.(); result?.() }
    }
  }
  else {
    callbacks.effect = callback
    addToRenderAndCall(() => {
      React.useEffect(callbacks.effect!, deps?.())
    })
  }
}

/**
 * _Analog of `useLayoutEffect(callback, deps())`_
 */
export function useLayoutEffect(callback: React.EffectCallback, deps?: () => React.DependencyList): void {
  const callbacks = getData().callbacks

  if (callbacks.layoutEffect) {
    const prevHandler = callbacks.layoutEffect
    callbacks.layoutEffect = () => {
      const prevResult = prevHandler()
      const result = callback()
      return () => { prevResult?.(); result?.() }
    }
  }
  else {
    callbacks.layoutEffect = callback
    addToRenderAndCall(() => {
      React.useLayoutEffect(callbacks.layoutEffect!, deps?.())
    })
  }
}

/**
 * Calls the function after unmounting the component
 *
 * _Analog of `useEffect(() => callback, [])`_
 */
export function useOnDestroy(callback: () => void): void {
  const callbacks = getData().callbacks

  if (callbacks.afterUnmount) {
    const prevHandler = callbacks.afterUnmount
    callbacks.afterUnmount = () => { prevHandler(); callback() }
  }
  else {
    callbacks.afterUnmount = callback
    addToRenderAndCall(() => {
      React.useEffect(() => callbacks.afterUnmount, [])
    })
  }
}

/**
 * Calls the function after drawing the component
 *
 * _Analog of `useLayoutEffect(callback, [])`_
 */
export function useOnDraw(callback: () => void): void {
  const callbacks = getData().callbacks

  if (callbacks.afterDraw) {
    const prevHandler = callbacks.afterDraw
    callbacks.afterDraw = () => { prevHandler(); callback() }
  }
  else {
    callbacks.afterDraw = callback
    addToRenderAndCall(() => {
      React.useLayoutEffect(callbacks.afterDraw!, [])
    })
  }
}

/**
 * Calls the function after mounting the component
 *
 * _Analog of `useEffect(callback, [])`_
 */
export function useOnMount(callback: () => void): void {
  const callbacks = getData().callbacks

  if (callbacks.afterMount) {
    const prevHandler = callbacks.afterMount
    callbacks.afterMount = () => { prevHandler(); callback() }
  }
  else {
    callbacks.afterMount = callback
    addToRenderAndCall(() => {
      React.useEffect(callbacks.afterMount!, [])
    })
  }
}

/**
 * Calls the function immediately in constructor and before each render
 */
export function useOnRender(callback: () => void): void {
  addToRenderAndCall(callback)
}

/**
 * Returns reactive state.
 * Changes to the state will cause the component to be updated.
 */
export function useReactive<T extends State>(initial: T) {
  const forceUpdate = getForceUpdate()
  const state = addState({ ...initial }).val
  const obj = {} as T

  for (const key in state) {
    Object.defineProperty(obj, key, {
      get: () => state[key],
      set(newVal: any) {
        if (state[key] === newVal) return
        state[key] = newVal
        forceUpdate()
      },
      enumerable: true
    })
  }

  return obj
}

/**
 * Creates an object of the form `{ current: <ref_value> }`
 */
export function useRef<T = null>(initial = null as T): React.MutableRefObject<T> {
  return { current: initial }
}

/**
 * Returns wrapped redux actions to use it without dispatcher
 */
export function useActions<T extends Actions>(actions: T) {
  const dispatch = useDispatch()
  const obj = {} as T

  for (const name in actions)
    obj[name] = ((arg: any) => dispatch(actions[name](arg))) as typeof actions[typeof name]

  return obj
}

/**
 * Subscribes to redux-store changes and gets values depending on the passed configuration
 * @param config - object of the type `{ key: selector }`
 */
export function useRedux<T extends ReduxSelectors>(config: T) {
  const state = {} as { [key in keyof T]: ReturnType<T[key]> }

  addToRenderAndCall(() => {
    for (const name in config)
      state[name] = reduxUseSelector(config[name])
  })

  return state
}

/**
 * Allows to use a regular hook in the afc component.
 * 
 * @returns static value
 */
export function wrapStaticHook<T extends HookToWrap>(hook: T) {
  return ((...args: any[]) => {
    let value: any
    useOnRender(() => value = hook(...args))
    return value
  }) as T
}

/**
 * Allows to use a regular hook in the afc component.
 * 
 * @returns dynamic value
 */
export function wrapDynamicHook<T extends HookToWrap>(hook: T) {
  return (args: () => Parameters<T>) => {
    const value = {} as DynamicHookResult<T>
    useOnRender(() => value.val = hook(...args()))
    return value
  }
}
