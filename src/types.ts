import type { EffectCallback, ReactNode } from 'react'

import type { AnyAction, Dispatch } from 'redux'

export type Constructor<P extends object = {}> = (props: P) => RenderFunc<P>

export type HookToWrap = (...args: any[]) => any
export type DynamicHookResult<T extends HookToWrap> = { val: ReturnType<T> }

export type Actions = Record<string, (arg: any) => any>
export type ReduxSelectors = Record<string, (state: any) => any>
export type State = Record<string, any>

export type RenderFunc<P extends object = {}> = (props: P) => ReactNode
export type ConstructOptions = { lazyPropsUpdate?: boolean }

export interface Data<P extends object> {
  beforeRender(): void
  forceUpdate?(): void
  dispatch?: Dispatch<AnyAction>
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
  render: RenderFunc<P>
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
