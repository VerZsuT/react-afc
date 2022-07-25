import type { Context } from 'react'

import type { Dispatch, AnyAction } from 'redux'

export type FuncToInsert = () => void
export type RenderFunc = () => JSX.Element

export type Constructor<P> = (props: P) => RenderFunc

export interface Data<P> {
    inserts: FuncToInsert[]
    render: RenderFunc
    props: P
    contexts: any[]
}

export type UseReduxType = <T extends { [key: string]: (state: any) => any }>(config: T) => {
    [key in keyof T]: ReturnType<T[key]>
}

export type CreateStateType = <T>(initial: T) => [T, (newState: Partial<T>) => void]

export type InRenderType = (callback: () => void) => void

export type HandleContextType = <T>(context: Context<T>) => (() => T)

export type GetDispatcherType = <T extends Dispatch<AnyAction>>() => T

export type AfterUnmountType = (callback: () => void) => void

export type Stack = {
    useRedux: UseReduxType
    createState: CreateStateType
    inRender: InRenderType
    handleContext: HandleContextType
    getDispatcher: GetDispatcherType
    afterUnmount: AfterUnmountType
}[]

export interface StateRef<S> {
    current: S
}
