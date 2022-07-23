import type { Context } from 'react'

import type { Dispatch, AnyAction } from 'redux'

export type FuncToInsert = () => void
export type RenderFunc = () => JSX.Element

export type Constructor<P> = (props: P) => RenderFunc

export interface Data<P> {
    inserts: FuncToInsert[]
    render: RenderFunc
    props: P
    context: any
}

export type Stack = {
    createState<T>(initial: T): [T, (newState: Partial<T>) => void]
    useRedux<T>(config: T): T
    inRender(callback: () => void): void
    handleContext<T>(context: Context<T>): () => T
    getDispatcher<T extends Dispatch<AnyAction>>(): T
}[]

export type Selector<T> = {
    type: 'selector'
    value(): T
}

export interface StateRef<S> {
    current: S
}
