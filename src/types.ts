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
    useRedux<T extends { [key: string]: (state: any) => any }>(config: T): {
        [key in keyof T]: ReturnType<T[key]>
    }
    createState<T>(initial: T): [T, (newState: Partial<T>) => void]
    inRender(callback: () => void): void
    handleContext<T>(context: Context<T>): () => T
    getDispatcher<T extends Dispatch<AnyAction>>(): T
}[]

export interface StateRef<S> {
    current: S
}
