import React from 'react'

import { useDispatch as reduxUseDispatch, useSelector as reduxUseSelector } from 'react-redux'
import type { AnyAction, Dispatch } from 'redux'

import { addState, addToRenderAndCall, changeName, fastUpdateProps, getData, getForceUpdate, inspectState, lazyUpdateProps, withData } from './lib'
import type { Actions, AFC, AFCOptions, CommonState, Data, DynamicHookResult, FAFC, FastProps, HookToWrap, ObjectState, ObjectStateSetters, PAFC, ReduxSelectors, State } from './types'

/**
 * Returns a component with constructor functionality
 */
export function afc<P extends object>(constructor: AFC<P>, options?: AFCOptions) {
  const updateProps = options?.lazyPropsUpdate ? lazyUpdateProps : fastUpdateProps

  return changeName((props: P) => {
    const ref = React.useRef<Data<P>>()
    let data = ref.current

    if (data) {
      if (data.prevProps !== props)
        data.prevProps = updateProps(props, data.props)
      inspectState(data)
      data.beforeRender()
      return data.render()
    }

    ref.current = data = {
      beforeRender() { },
      callbacks: {},
      state: { lastIndex: 0 },
      render() { return null },
      prevProps: props,
      props: { ...props },
      sharedStore: {
        get [PROPS_STORE]() { return data?.props }
      }
    }

    inspectState(data)
    withData(data, () => {
      data!.render = constructor(data!.props)
    })
    return data.render()
  }, constructor) as React.FC<P>
}

/**
 * Returns a component with constructor functionality
 * 
 * _Does not accept or transmit props_
 */
export function pafc(constructor: PAFC) {
  return changeName(() => {
    const ref = React.useRef<Data<null>>()
    let data = ref.current

    if (data) {
      inspectState(data)
      data.beforeRender()
      return data.render()
    }

    ref.current = data = {
      beforeRender() { },
      callbacks: {},
      state: { lastIndex: 0 },
      render() { return null },
      props: null
    }

    inspectState(data)
    withData(data, () => {
      data!.render = constructor()
    })
    return data.render()
  }, constructor) as React.FC
}

/**
 * Returns a component with constructor functionality
 * 
 * _Updated faster then `afc`_
 */
export function fafc<P extends object>(constructor: FAFC<P>) {
  return changeName((props: P) => {
    const ref = React.useRef<Data<FastProps<P>>>()
    let data = ref.current

    if (data) {
      data.props.val = props
      inspectState(data)
      data.beforeRender()
      return data.render()
    }

    ref.current = data = {
      beforeRender() { },
      render() { return null },
      callbacks: {},
      state: { lastIndex: 0 },
      props: { val: props },
      sharedStore: {
        get [FAST_PROPS_STORE]() { return data?.props }
      }
    }

    inspectState(data)
    withData(data, () => {
      data!.render = constructor(data!.props)
    })
    return data.render()
  }, constructor) as React.FC<P>
}

/**
 * Returns a memo component with constructor functionality
 */
export function afcMemo<P extends object>(constructor: AFC<P>, options?: AFCOptions) {
  return React.memo(afc(constructor, options))
}

/**
 * Returns a memo component with constructor functionality
 * 
 * _Updates faster then `afc`_
 */
export function fafcMemo<P extends object>(constructor: FAFC<P>) {
  return React.memo(fafc(constructor))
}

/**
 * Returns a component with constructor functionality
 * 
 * _Does not accept or transmit props_
 */
export function pafcMemo(constructor: PAFC) {
  return React.memo(pafc(constructor))
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

export const MAIN_STORE = '__MAIN__'
export const PROPS_STORE = '__PROPS__'
export const FAST_PROPS_STORE = '__FAST_PROPS__'

export function useSharedStore<T extends object = {}>(): T
export function useSharedStore<T extends object = {}>(name: string): T
export function useSharedStore<T extends object = {}>(intial: T): T
export function useSharedStore<T extends object = {}>(name: string, initial: T): T
export function useSharedStore<T extends object = {}>(nameOrInitial?: string | T, initial?: T): T {
  const sharedStore = (getData().sharedStore ||= {})
  let store: T

  if (typeof nameOrInitial === 'string')
    store = (sharedStore[nameOrInitial] ||= initial || {})
  else
    store = (sharedStore[MAIN_STORE] ||= nameOrInitial || {})

  return store
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
    return
  }

  callbacks.effect = callback
  addToRenderAndCall(() => {
    React.useEffect(callbacks.effect!, deps?.())
  })
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
    return
  }

  callbacks.layoutEffect = callback
  addToRenderAndCall(() => {
    React.useLayoutEffect(callbacks.layoutEffect!, deps?.())
  })
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
    return
  }

  callbacks.afterUnmount = callback
  addToRenderAndCall(() => {
    React.useEffect(() => callbacks.afterUnmount, [])
  })
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
    return
  }

  callbacks.afterDraw = callback
  addToRenderAndCall(() => {
    React.useLayoutEffect(callbacks.afterDraw!, [])
  })
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
    return
  }

  callbacks.afterMount = callback
  addToRenderAndCall(() => {
    React.useEffect(callbacks.afterMount!, [])
  })
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
