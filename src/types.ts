import type { EffectCallback, ReactNode } from 'react'

import type { AnyAction, Dispatch } from 'redux'

type Constructor<P> = (props: P) => RenderFunc

export type HookToWrap = (...args: any[]) => any
export type DynamicHookResult<T extends HookToWrap> = { val: ReturnType<T> }

export type Actions = Record<string, (arg: any) => any>
export type ReduxSelectors = Record<string, (state: any) => any>
export type State = Record<string, any>

export type RenderFunc = () => ReactNode
export type AFC<P = {}> = Constructor<P>
export type FAFC<P = {}> = Constructor<FastProps<P>>
export type PAFC = () => RenderFunc

export type FastProps<P> = { val: P }
export type AFCOptions = { lazyPropsUpdate?: boolean }

export interface Data<P> {
  beforeRender(): void
  forceUpdate?(): void
  dispatch?: Dispatch<AnyAction>
  sharedStore?: Record<string, any>
  callbacks: {
    afterMount?(): void
    afterUnmount?(): void
    afterDraw?(): void
    effect?: EffectCallback
    layoutEffect?: EffectCallback
  }
  state: {
    [key: number]: any
    lastIndex: number
  }
  render: RenderFunc
  props: P
  prevProps?: P
}

export type ObjectStateSetters<T> = {
  [key in keyof T as `set${Capitalize<string & key>}`]: (value: T[key]) => void
}

export type ObjectState<T> = {
  state: T
} & ObjectStateSetters<T>

export type CommonState<T> = [{ val: T }, (value: T) => void]
