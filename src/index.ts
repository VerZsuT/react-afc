import type { Context, FC, ReactNode } from 'react'
import { memo, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import type { AnyAction, Dispatch } from 'redux'

import { addToRenderAndCall, fastUpdateProps, getCurrentData, getForceUpdate, lazyUpdateProps, resetData, setData } from './lib'
import type { Actions, AFCOptions, Constructable, Constructor, Data, FastProps, IInjectable, ReduxSelectors, Ref, State, StateReturns, StateSetters } from './types'

/**
 * Returns a component with constructor functionality
 */
export function afc<P extends object>(constructor: Constructor<P>, options?: AFCOptions): FC<P> {
  const updateProps = options?.lazyPropsUpdate ? lazyUpdateProps : fastUpdateProps

  return <FC<P>> ((props: P): ReactNode => {
    const ref = useRef<Data<P>>()
    let refData = ref.current

    if (refData) {
      if (refData.prevProps !== props) {
        updateProps(props, refData.props)
        refData.prevProps = props
      }
      refData.beforeRender()
      return refData.render()
    }

    refData = ref.current = {
      beforeRender: () => null,
      events: {},
      render: () => null,
      prevProps: props,
      props: { ...props }
    }
    
    setData(refData)
    refData.render = constructor(refData.props)
    resetData()
    return refData.render()
  })
}

/**
 * Returns a component with constructor functionality
 * 
 * _Faster then common `afc`_
 */
export function fafc<P extends object>(constructor: Constructor<FastProps<P>>): FC<P> {
  return <FC<P>> ((props: P): ReactNode => {
    const ref = useRef<Data<FastProps<P>>>()
    let refData = ref.current

    if (refData) {
      refData.props.curr = props
      refData.beforeRender()
      return refData.render()
    }

    refData = ref.current = {
      beforeRender: () => null,
      render: () => null,
      events: {},
      props: { curr: props }
    }
    
    setData(refData)
    refData.render = constructor(refData.props)
    resetData()
    return refData.render()
  })
}

/**
 * Returns a memo component with constructor functionality
 */
export function afcMemo<P extends object>(constructor: Constructor<P>, options?: AFCOptions) {
  return memo(afc<P>(constructor, options))
}

/**
 * Returns a memo component with constructor functionality
 * 
 * _Faster then common `afcMemo`_
 */
export function fafcMemo<P extends object>(constructor: Constructor<FastProps<P>>) {
  return memo(fafc<P>(constructor))
}

/**
 * Creates a state
 *
 * _Before applying the state changes, superficially compares the previous and new state_
 * @returns - { state, set<Key> }
 */
export function createState<T extends State>(initial: T): StateReturns<T> {
  const forceUpdate = getForceUpdate()
  const setters = <StateSetters<T>> {}
  const state = { ...initial }

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
 * Returns redux-dispatch
 */
export function getDispatch<T = Dispatch<AnyAction>>(): T {
  const data = getCurrentData()
  if (!data.dispatch)
    data.dispatch = addToRenderAndCall(useDispatch)
  return <T> data.dispatch
}

/**
 * Subscribes to context changes
 * @returns context getter
 */
export function handleContext<T>(context: Context<T>): () => T {
  let value: T
  addToRenderAndCall(() => value = useContext(context))
  return () => value
}

/**
 * Mark class as injectable
 */
export function Injectable<T extends Constructable<any>>(Constructable: T): IInjectable & T {
  return class extends Constructable {
    static __injectInstance__ = null
    constructor(...args: any[]) {
      super(...args)
    }
  }
}

/**
 * Returns the only instance of the passed injectable Type
 */
export function inject<T extends IInjectable>(Type: T): InstanceType<T> {
  switch (Type.__injectInstance__) {
  case undefined:
    throw new Error(`Type ${Type} is not injectable`)
  case null:
    Type.__injectInstance__ = new Type()
    break
  }

  return Type.__injectInstance__
}

/**
 * Returns the getter of the memoized value
 */
export function memoized<T>(factory: () => T, depsGetter: () => any[]): () => T {
  let value: T
  addToRenderAndCall(() => value = useMemo(factory, depsGetter()))
  return () => value
}

/**
 * Calls the function after unmounting the component
 *
 * _Analog of `useEffect(() => callback, [])`_
 */
export function onDestroy(callback: () => void): void {
  const events = getCurrentData().events

  if (events.afterUnmount) {
    const prevHandler = events.afterUnmount
    events.afterUnmount = () => { prevHandler(); callback() }
    return
  }

  events.afterUnmount = callback
  addToRenderAndCall(() => {
    useEffect(() => events.afterUnmount, [])
  })
}

/**
 * Calls the function after drawing the component
 *
 * _Analog of `useLayoutEffect(callback, [])`_
 */
export function onDraw(callback: () => void): void {
  const events = getCurrentData().events

  if (events.afterDraw) {
    const prevHandler = events.afterDraw
    events.afterDraw = () => { prevHandler(); callback() }
    return
  }

  events.afterDraw = callback
  addToRenderAndCall(() => {
    useLayoutEffect(events.afterDraw!, [])
  })
}

/**
 * Calls the function after mounting the component
 *
 * _Analog of `useEffect(callback, [])`_
 */
export function onMount(callback: () => void): void {
  const events = getCurrentData().events

  if (events.afterMount) {
    const prevHandler = events.afterMount
    events.afterMount = () => { prevHandler(); callback() }
    return
  }

  events.afterMount = callback
  addToRenderAndCall(() => {
    useEffect(events.afterMount!, [])
  })
}

/**
 * Calls the function immediately in constructor and before each render
 */
export function onRender(callback: () => void): void {
  addToRenderAndCall(callback)
}

/**
 * Returns reactive state.
 * Changes to the state will cause the component to be updated.
 */
export function reactive<T extends State>(state: T): T {
  const forceUpdate = getForceUpdate()
  const value = { ...state }
  const obj = <T> {}

  for (const key in value) {
    Object.defineProperty(obj, key, {
      get: () => value[key],
      set(newVal: any) {
        if (value[key] === newVal) return
        value[key] = newVal
        forceUpdate()
      },
      enumerable: true
    })
  }

  return obj
}

/**
 * Creates an object of the form `{ value: <ref_value> }`.
 *
 * When the `value` changes, the component is updated
 */
export function ref<T>(initial: T, isReactive = true): Ref<T> {
  if (!isReactive) return { value: initial }

  const forceUpdate = getForceUpdate()
  let value = initial

  return {
    get value(): T {
      return value
    },
    set value(newVal: T) {
      if (value === newVal) return
      value = newVal
      forceUpdate()
    }
  }
}

/**
 * Returns wrapped redux actions to use it without dispatcher
 */
export function useActions<T extends Actions>(actions: T): T {
  const dispatch = getDispatch()
  const obj = <T> {}

  for (const name in actions)
    obj[name] = ((arg: any) => dispatch(actions[name](arg))) as typeof actions[typeof name]

  return obj
}

/**
 * Subscribes to redux-store changes and gets values depending on the passed configuration
 * @param config - object of the type `{ key: selector }`
 */
export function useRedux<T extends ReduxSelectors>(config: T) {
  type StateType = { [key in keyof T]: ReturnType<T[key]> }
  const state = <StateType> {}

  addToRenderAndCall(() => {
    for (const name in config)
      state[name] = useSelector(config[name])
  })

  return state
}

export type { AFC } from './types'
