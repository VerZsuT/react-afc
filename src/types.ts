import type {AnyAction, Dispatch } from 'redux'

export type RenderFunc = () => JSX.Element
export type Constructor<P> = (props: P) => RenderFunc
export type AFC<P> = Constructor<P>
export type Action = (arg: any) => any
export type Selector<T> = (state: T) => any
export type Ref<T> = { value: T }

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

export interface Actions {
    [key: string]: Action
}

export interface UseReduxConfig<T> {
    [key: string]: Selector<T>
}
