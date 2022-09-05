export type RenderFunc = () => JSX.Element

export type Constructor<P> = (props: P) => RenderFunc

export type Data<P> = {
    beforeRender: () => void
    render: RenderFunc
    props: P
}

export type StateSetters<T> = {
    [key in keyof T as `set${Capitalize<string & key>}`]: (value: T[key]) => void
}

export type StateReturns<T> = { state: T } & StateSetters<T>

export type Actions = {
    [key: string]: (arg: any) => any
}

export type UseReduxConfig<T> = {
    [key: string]: (state: T) => any
}
