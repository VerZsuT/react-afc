import type { ReactNode } from 'react'

import type { AnyAction, Dispatch } from 'redux'

export type Actions = Record<string, (arg: any) => any>
export type ReduxSelectors = Record<string, (state: any) => any>
export type State = Record<string, any>

export type RenderFunc = () => ReactNode
export type Constructor<P> = (props: P) => RenderFunc
export type AFC<P> = Constructor<P>
export type Ref<T> = { value: T }

export type FastProps<P> = { curr: P }
export type AFCOptions = { lazyPropsUpdate?: boolean }

export interface Constructable<T> {
  new(...args: any[]): T
}

export interface IInjectable extends Constructable<any> {
  __injectInstance__?: any
}

export interface Data<P> {
  beforeRender(): void
  forceUpdate?(): void
  dispatch?: Dispatch<AnyAction>
  events: {
    afterMount?(): void
    afterUnmount?(): void
    afterDraw?(): void
  }
  render: RenderFunc
  props: P
}

export type StateSetters<T> = {
  [key in keyof T as `set${Capitalize<string & key>}`]: (value: T[key]) => void
}

export type StateReturns<T> = {
  state: T
} & StateSetters<T>
